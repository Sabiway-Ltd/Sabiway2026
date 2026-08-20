import math

from django.db.models import Q
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from .markets import normalise_country_code
from .models import (
    BookingAudit,
    BookingRequest,
    ConversationBlock,
    ConversationReport,
    JobPosting,
    JobResponse,
    Message,
    MessageThread,
    ScheduleProposal,
    ServiceCategory,
    ServiceListing,
)
from .pagination import MarketplacePagination
from .permissions import IsListingOwnerOrReadOnly
from .realtime import broadcast_marketplace_event
from .serializers import (
    BookingRequestSerializer,
    BookingStatusSerializer,
    ConversationReportSerializer,
    JobPostingSerializer,
    JobResponseSerializer,
    JobResponseStatusSerializer,
    MessageSerializer,
    ScheduleDecisionSerializer,
    ScheduleProposalSerializer,
    ServiceCategorySerializer,
    ServiceListingSerializer,
    ThreadSerializer,
)

EARTH_RADIUS_KM = 6371.0088


def _float_param(params, key):
    raw = (params.get(key) or "").strip()
    if not raw:
        return None
    try:
        return float(raw)
    except (TypeError, ValueError):
        raise ValidationError({key: "Use a numeric value."})


def _haversine_km(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(float, (lat1, lon1, lat2, lon2))
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _preferred_location_params(request):
    params = request.query_params
    explicit = any((params.get(key) or "").strip() for key in ["location", "country", "country_code", "state", "city", "area", "postcode", "near_lat", "near_lng"])
    if explicit or not request.user.is_authenticated:
        return {}
    profile = getattr(request.user, "profile", None)
    if not profile:
        return {}
    return {
        "country_code": profile.preferred_country_code or profile.country_code,
        "state": profile.preferred_state or profile.state,
        "city": profile.preferred_city or profile.city,
        "area": profile.preferred_area,
        "postcode": profile.preferred_postcode,
        "near_lat": profile.preferred_latitude or profile.latitude,
        "near_lng": profile.preferred_longitude or profile.longitude,
    }


def _param(request, key, defaults):
    value = (request.query_params.get(key) or "").strip()
    if value:
        return value
    fallback = defaults.get(key)
    return str(fallback) if fallback not in (None, "") else ""


def _apply_location_filters(queryset, request, *, include_service_areas=False):
    params = request.query_params
    defaults = _preferred_location_params(request)
    location = _param(request, "location", defaults)
    country = _param(request, "country", defaults)
    country_code_raw = _param(request, "country_code", defaults)
    state = _param(request, "state", defaults)
    city = _param(request, "city", defaults)
    area = _param(request, "area", defaults)
    postcode = _param(request, "postcode", defaults)
    country_code = normalise_country_code(country_code_raw or country)

    if location:
        q = Q(country__icontains=location) | Q(state__icontains=location) | Q(city__icontains=location) | Q(area__icontains=location) | Q(postcode__icontains=location)
        code = normalise_country_code(location)
        if code:
            q |= Q(country_code=code)
        if include_service_areas:
            q |= Q(service_areas__state__icontains=location) | Q(service_areas__city__icontains=location) | Q(service_areas__area__icontains=location) | Q(service_areas__postcode__icontains=location)
            if code:
                q |= Q(service_areas__country_code=code)
        queryset = queryset.filter(q)
    if country_code:
        q = Q(country_code=country_code)
        if include_service_areas:
            q |= Q(service_areas__country_code=country_code)
        queryset = queryset.filter(q)
    elif country:
        queryset = queryset.filter(country__icontains=country)
    for field, value in [("state", state), ("city", city), ("area", area), ("postcode", postcode)]:
        if value:
            q = Q(**{f"{field}__icontains": value})
            if include_service_areas:
                q |= Q(**{f"service_areas__{field}__icontains": value})
            queryset = queryset.filter(q)
    return queryset.distinct(), defaults


def _location_points(listing):
    points = []
    if listing.latitude is not None and listing.longitude is not None:
        points.append((listing.latitude, listing.longitude, listing.service_radius_km))
    for service_area in listing.service_areas.all():
        if service_area.latitude is not None and service_area.longitude is not None:
            points.append((service_area.latitude, service_area.longitude, service_area.radius_km))
    return points


def _rank_listings_by_distance(items, lat, lng, requested_radius):
    ranked = []
    for listing in items:
        if listing.delivery_mode == ServiceListing.DeliveryMode.REMOTE:
            listing.distance_km = None
            ranked.append((1, float("inf"), listing))
            continue
        distances = []
        acceptable = False
        for point_lat, point_lng, service_radius in _location_points(listing):
            distance = _haversine_km(lat, lng, point_lat, point_lng)
            distances.append(distance)
            effective_radius = float(requested_radius) if requested_radius is not None else float(service_radius) if service_radius is not None else None
            if effective_radius is None or distance <= effective_radius:
                acceptable = True
        if distances:
            listing.distance_km = min(distances)
        else:
            listing.distance_km = None
        if acceptable or listing.delivery_mode == ServiceListing.DeliveryMode.BOTH:
            ranked.append((0 if acceptable else 1, listing.distance_km if listing.distance_km is not None else float("inf"), listing))
    ranked.sort(key=lambda row: (row[0], row[1], not row[2].is_featured, not row[2].available_now))
    return [row[2] for row in ranked]


def _rank_jobs_by_distance(items, lat, lng, requested_radius):
    ranked = []
    for job in items:
        if job.delivery_mode == ServiceListing.DeliveryMode.REMOTE:
            job.distance_km = None
            ranked.append((1, float("inf"), job))
            continue
        if job.latitude is None or job.longitude is None:
            if job.delivery_mode == ServiceListing.DeliveryMode.BOTH:
                job.distance_km = None
                ranked.append((1, float("inf"), job))
            continue
        distance = _haversine_km(lat, lng, job.latitude, job.longitude)
        job.distance_km = distance
        effective_radius = float(requested_radius) if requested_radius is not None else float(job.search_radius_km) if job.search_radius_km is not None else None
        if effective_radius is None or distance <= effective_radius or job.delivery_mode == ServiceListing.DeliveryMode.BOTH:
            ranked.append((0 if effective_radius is None or distance <= effective_radius else 1, distance, job))
    ranked.sort(key=lambda row: (row[0], row[1]))
    return [row[2] for row in ranked]


def _booking_audit(booking, actor, event, old="", new="", metadata=None):
    return BookingAudit.objects.create(booking=booking, actor=actor, event=event, from_status=old, to_status=new, metadata=metadata or {})


def _other_participant(booking, actor):
    return booking.professional if actor.pk == booking.client_id else booking.client


class ServiceCategoryViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = ServiceCategory.objects.filter(is_active=True).prefetch_related("subcategories")
    lookup_field = "slug"


class ServiceListingViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceListingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsListingOwnerOrReadOnly]
    pagination_class = MarketplacePagination

    def get_queryset(self):
        queryset = ServiceListing.objects.select_related("provider__user", "category", "subcategory").prefetch_related("service_areas")
        mine = self.request.user.is_authenticated and self.request.query_params.get("mine") == "1"
        if mine:
            queryset = queryset.filter(provider=self.request.user.profile)
        else:
            queryset = queryset.filter(is_active=True, moderation_status=ServiceListing.ModerationStatus.APPROVED, category__is_active=True)
        q = self.request.query_params.get("q", "").strip()
        category = self.request.query_params.get("category", "").strip()
        subcategory = self.request.query_params.get("subcategory", "").strip()
        delivery_mode = self.request.query_params.get("delivery_mode", "").strip()
        available_now = self.request.query_params.get("available_now", "").strip().lower()
        if q:
            queryset = queryset.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(category__name__icontains=q) | Q(subcategory__name__icontains=q) | Q(provider__full_name__icontains=q) | Q(provider__job__icontains=q))
        if category:
            queryset = queryset.filter(category__slug=category)
        if subcategory:
            queryset = queryset.filter(subcategory__slug=subcategory)
        if delivery_mode:
            queryset = queryset.filter(delivery_mode=delivery_mode)
        if available_now in {"1", "true", "yes"}:
            queryset = queryset.filter(available_now=True)
        queryset, _ = _apply_location_filters(queryset, self.request, include_service_areas=True)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        defaults = _preferred_location_params(request)
        lat = _float_param(request.query_params, "near_lat")
        lng = _float_param(request.query_params, "near_lng")
        if lat is None and defaults.get("near_lat") is not None:
            lat = float(defaults["near_lat"])
        if lng is None and defaults.get("near_lng") is not None:
            lng = float(defaults["near_lng"])
        radius = _float_param(request.query_params, "radius_km")
        items = list(queryset)
        if lat is not None and lng is not None:
            items = _rank_listings_by_distance(items, lat, lng, radius)
        page = self.paginate_queryset(items)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(items, many=True).data)

    def perform_create(self, serializer):
        profile = self.request.user.profile
        if self.request.user.role != "professional":
            raise PermissionDenied("Only professional profiles can publish service listings.")
        serializer.save(provider=profile, moderation_status=ServiceListing.ModerationStatus.PENDING)

    def perform_update(self, serializer):
        if serializer.instance.provider_id != self.request.user.profile.pk:
            raise PermissionDenied("You cannot update another professional's listing.")
        serializer.save(moderation_status=ServiceListing.ModerationStatus.PENDING)


class JobPostingViewSet(viewsets.ModelViewSet):
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = MarketplacePagination

    def get_queryset(self):
        queryset = JobPosting.objects.select_related("client__user", "category", "subcategory")
        mine = self.request.user.is_authenticated and self.request.query_params.get("mine") == "1"
        if mine:
            queryset = queryset.filter(client=self.request.user.profile)
        else:
            queryset = queryset.filter(status=JobPosting.Status.OPEN, moderation_status=JobPosting.ModerationStatus.APPROVED, category__is_active=True)
        q = self.request.query_params.get("q", "").strip()
        category = self.request.query_params.get("category", "").strip()
        delivery_mode = self.request.query_params.get("delivery_mode", "").strip()
        if q:
            queryset = queryset.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(category__name__icontains=q) | Q(subcategory__name__icontains=q))
        if category:
            queryset = queryset.filter(category__slug=category)
        if delivery_mode:
            queryset = queryset.filter(delivery_mode=delivery_mode)
        queryset, _ = _apply_location_filters(queryset, self.request)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        defaults = _preferred_location_params(request)
        lat = _float_param(request.query_params, "near_lat")
        lng = _float_param(request.query_params, "near_lng")
        if lat is None and defaults.get("near_lat") is not None:
            lat = float(defaults["near_lat"])
        if lng is None and defaults.get("near_lng") is not None:
            lng = float(defaults["near_lng"])
        radius = _float_param(request.query_params, "radius_km")
        items = list(queryset)
        if lat is not None and lng is not None:
            items = _rank_jobs_by_distance(items, lat, lng, radius)
        page = self.paginate_queryset(items)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(items, many=True).data)

    def perform_create(self, serializer):
        profile = self.request.user.profile
        if self.request.user.role != "client":
            raise PermissionDenied("Only client profiles can create jobs.")
        serializer.save(client=profile, moderation_status=JobPosting.ModerationStatus.PENDING)

    def perform_update(self, serializer):
        if serializer.instance.client_id != self.request.user.profile.pk:
            raise PermissionDenied("You cannot update another client's job.")
        serializer.save(moderation_status=JobPosting.ModerationStatus.PENDING)

    def perform_destroy(self, instance):
        if instance.client_id != self.request.user.profile.pk:
            raise PermissionDenied("You cannot delete another client's job.")
        instance.delete()


class JobResponseViewSet(viewsets.ModelViewSet):
    serializer_class = JobResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        profile = self.request.user.profile
        return JobResponse.objects.select_related("professional__user", "job__client__user", "job__category").filter(Q(professional=profile) | Q(job__client=profile)).distinct()

    def perform_create(self, serializer):
        serializer.save(professional=self.request.user.profile)

    @action(detail=True, methods=["post"], url_path="decision")
    def decision(self, request, pk=None):
        response = self.get_object()
        if response.job.client_id != request.user.profile.pk:
            raise PermissionDenied("Only the job owner can shortlist or decline responses.")
        decision = JobResponseStatusSerializer(data=request.data)
        decision.is_valid(raise_exception=True)
        response.status = decision.validated_data["status"]
        response.save(update_fields=["status", "updated_at"])
        return Response(JobResponseSerializer(response, context={"request": request}).data)


class MessageThreadViewSet(viewsets.ModelViewSet):
    serializer_class = ThreadSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        me = self.request.user.profile
        return MessageThread.objects.select_related("client__user", "professional__user", "listing", "job", "job_response").filter(Q(client=me) | Q(professional=me)).distinct()

    def create(self, request, *args, **kwargs):
        me = request.user.profile
        listing_id = request.data.get("listing_id")
        response_id = request.data.get("job_response_id")
        existing = None
        if request.user.role == "client" and listing_id:
            existing = MessageThread.objects.filter(client=me, listing_id=listing_id, status=MessageThread.Status.OPEN).first()
        elif request.user.role == "professional" and response_id:
            existing = MessageThread.objects.filter(professional=me, job_response_id=response_id, status=MessageThread.Status.OPEN).first()
        if existing:
            return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        me = self.request.user.profile
        data = serializer.validated_data
        if self.request.user.role == "client":
            listing = data.get("listing")
            professional = listing.provider if listing else data.get("professional")
            serializer.save(client=me, professional=professional)
        else:
            response = data["job_response"]
            serializer.save(client=response.job.client, professional=me, job=response.job)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        thread = self.get_object()
        now = timezone.now()
        count = thread.messages.filter(is_read=False).exclude(sender=request.user.profile).update(is_read=True, read_at=now)
        return Response({"marked_read": count})

    @action(detail=True, methods=["post"])
    def block(self, request, pk=None):
        thread = self.get_object()
        me = request.user.profile
        other = thread.professional if me.pk == thread.client_id else thread.client
        block, _ = ConversationBlock.objects.update_or_create(blocker=me, blocked=other, defaults={"thread": thread, "is_active": True})
        return Response({"blocked": True, "id": block.pk})

    @action(detail=True, methods=["post"])
    def unblock(self, request, pk=None):
        thread = self.get_object()
        me = request.user.profile
        other = thread.professional if me.pk == thread.client_id else thread.client
        ConversationBlock.objects.filter(blocker=me, blocked=other).update(is_active=False)
        return Response({"blocked": False})

    @action(detail=True, methods=["post"])
    def report(self, request, pk=None):
        thread = self.get_object()
        me = request.user.profile
        other = thread.professional if me.pk == thread.client_id else thread.client
        serializer = ConversationReportSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        reported_message = serializer.validated_data.get("message")
        if reported_message and reported_message.thread_id != thread.id:
            raise ValidationError({"message_id": "Reported message must belong to this conversation."})
        report = serializer.save(thread=thread, reporter=me, reported_user=other)
        return Response(ConversationReportSerializer(report).data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        me = self.request.user.profile
        qs = Message.objects.select_related("thread__client__user", "thread__professional__user", "sender__user").filter(Q(thread__client=me) | Q(thread__professional=me))
        thread_id = self.request.query_params.get("thread")
        return qs.filter(thread_id=thread_id) if thread_id else qs.none()

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user.profile)
        thread = message.thread
        thread.last_message_at = message.created_at
        thread.save(update_fields=["last_message_at", "updated_at"])
        recipient = thread.professional if message.sender_id == thread.client_id else thread.client
        broadcast_marketplace_event([recipient.user_id], "new-message", MessageSerializer(message, context={"request": self.request}).data)


class BookingRequestViewSet(viewsets.ModelViewSet):
    serializer_class = BookingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        me = self.request.user.profile
        return BookingRequest.objects.select_related("client__user", "professional__user", "listing", "job", "job_response", "thread").filter(Q(client=me) | Q(professional=me)).distinct()

    def perform_create(self, serializer):
        thread = serializer.validated_data["thread"]
        booking = serializer.save(client=thread.client, professional=thread.professional, listing=thread.listing, job=thread.job, job_response=thread.job_response)
        _booking_audit(booking, self.request.user.profile, "booking_created", "", booking.status, {"scope": booking.scope_summary, "price": str(booking.agreed_price), "currency": booking.currency})
        broadcast_marketplace_event([thread.professional.user_id], "booking-updated", BookingRequestSerializer(booking, context={"request": self.request}).data)

    @action(detail=True, methods=["post"], url_path="status")
    def update_status(self, request, pk=None):
        booking = self.get_object()
        me = request.user.profile
        serializer = BookingStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = serializer.validated_data["status"]
        old = booking.status
        if me.pk == booking.client_id:
            allowed = {BookingRequest.Status.PENDING: {BookingRequest.Status.CANCELLED}, BookingRequest.Status.ACCEPTED: {BookingRequest.Status.CANCELLED, BookingRequest.Status.IN_PROGRESS}, BookingRequest.Status.IN_PROGRESS: {BookingRequest.Status.COMPLETED}}
        elif me.pk == booking.professional_id:
            allowed = {BookingRequest.Status.PENDING: {BookingRequest.Status.ACCEPTED, BookingRequest.Status.DECLINED}, BookingRequest.Status.ACCEPTED: {BookingRequest.Status.CANCELLED, BookingRequest.Status.IN_PROGRESS}, BookingRequest.Status.IN_PROGRESS: {BookingRequest.Status.COMPLETED}}
        else:
            raise PermissionDenied("You are not part of this booking.")
        if target not in allowed.get(old, set()):
            raise PermissionDenied("Invalid booking status transition.")
        booking.status = target
        if target == BookingRequest.Status.ACCEPTED:
            booking.accepted_at = timezone.now()
        booking.save(update_fields=["status", "accepted_at", "updated_at"])
        _booking_audit(booking, me, "status_changed", old, target)
        other = _other_participant(booking, me)
        broadcast_marketplace_event([other.user_id], "booking-updated", BookingRequestSerializer(booking, context={"request": request}).data)
        return Response(BookingRequestSerializer(booking, context={"request": request}).data)


class ScheduleProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        me = self.request.user.profile
        return ScheduleProposal.objects.select_related("booking__client", "booking__professional", "proposer").filter(Q(booking__client=me) | Q(booking__professional=me)).distinct()

    def perform_create(self, serializer):
        booking = serializer.validated_data["booking"]
        me = self.request.user.profile
        ScheduleProposal.objects.filter(booking=booking, status=ScheduleProposal.Status.PROPOSED).update(status=ScheduleProposal.Status.SUPERSEDED)
        proposal = serializer.save(proposer=me)
        booking.schedule_status = BookingRequest.ScheduleStatus.PROPOSED
        booking.save(update_fields=["schedule_status", "updated_at"])
        _booking_audit(booking, me, "schedule_proposed", metadata={"proposal_id": str(proposal.id), "proposed_for": proposal.proposed_for.isoformat(), "timezone": proposal.timezone})
        other = _other_participant(booking, me)
        broadcast_marketplace_event([other.user_id], "schedule-updated", ScheduleProposalSerializer(proposal, context={"request": self.request}).data)

    @action(detail=True, methods=["post"])
    def decision(self, request, pk=None):
        proposal = self.get_object()
        me = request.user.profile
        booking = proposal.booking
        if me.pk == proposal.proposer_id:
            raise PermissionDenied("The other participant must respond to this proposal.")
        serializer = ScheduleDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = serializer.validated_data["status"]
        if proposal.status != ScheduleProposal.Status.PROPOSED:
            raise PermissionDenied("This proposal is no longer active.")
        proposal.status = target
        proposal.responded_at = timezone.now()
        proposal.save(update_fields=["status", "responded_at"])
        if target == ScheduleProposal.Status.ACCEPTED:
            booking.requested_for = proposal.proposed_for
            booking.timezone = proposal.timezone
            booking.schedule_status = BookingRequest.ScheduleStatus.ACCEPTED
        else:
            booking.schedule_status = BookingRequest.ScheduleStatus.CHANGE_REQUESTED
        booking.save(update_fields=["requested_for", "timezone", "schedule_status", "updated_at"])
        _booking_audit(booking, me, "schedule_decision", metadata={"proposal_id": str(proposal.id), "decision": target})
        other = _other_participant(booking, me)
        broadcast_marketplace_event([other.user_id], "schedule-updated", ScheduleProposalSerializer(proposal, context={"request": request}).data)
        return Response(ScheduleProposalSerializer(proposal, context={"request": request}).data)
