from django.db.models import Q
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

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


def _apply_location_filters(queryset, params):
    location = params.get("location", "").strip()
    if location:
        queryset = queryset.filter(
            Q(country__icontains=location)
            | Q(state__icontains=location)
            | Q(city__icontains=location)
            | Q(area__icontains=location)
        )
    for field in ["country", "state", "city", "area"]:
        value = params.get(field, "").strip()
        if value:
            queryset = queryset.filter(**{f"{field}__icontains": value})
    return queryset


def _booking_audit(booking, actor, event, old="", new="", metadata=None):
    return BookingAudit.objects.create(
        booking=booking,
        actor=actor,
        event=event,
        from_status=old,
        to_status=new,
        metadata=metadata or {},
    )


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
        queryset = ServiceListing.objects.select_related("provider__user", "category", "subcategory")
        mine = self.request.user.is_authenticated and self.request.query_params.get("mine") == "1"
        if mine:
            queryset = queryset.filter(provider=self.request.user.profile)
        else:
            queryset = queryset.filter(
                is_active=True,
                moderation_status=ServiceListing.ModerationStatus.APPROVED,
                category__is_active=True,
            )
        q = self.request.query_params.get("q", "").strip()
        category = self.request.query_params.get("category", "").strip()
        subcategory = self.request.query_params.get("subcategory", "").strip()
        delivery_mode = self.request.query_params.get("delivery_mode", "").strip()
        available_now = self.request.query_params.get("available_now", "").strip().lower()
        if q:
            queryset = queryset.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(category__name__icontains=q)
                | Q(subcategory__name__icontains=q)
                | Q(provider__full_name__icontains=q)
                | Q(provider__job__icontains=q)
            )
        if category:
            queryset = queryset.filter(category__slug=category)
        if subcategory:
            queryset = queryset.filter(subcategory__slug=subcategory)
        if delivery_mode:
            queryset = queryset.filter(delivery_mode=delivery_mode)
        if available_now in {"1", "true", "yes"}:
            queryset = queryset.filter(available_now=True)
        return _apply_location_filters(queryset, self.request.query_params)

    def perform_create(self, serializer):
        profile = self.request.user.profile
        if self.request.user.role != "professional":
            raise PermissionDenied("Only professional profiles can publish service listings.")
        serializer.save(provider=profile, moderation_status=ServiceListing.ModerationStatus.PENDING)

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.provider_id != self.request.user.profile.pk:
            raise PermissionDenied("You cannot update another professional's listing.")
        material_fields = {
            "category",
            "subcategory",
            "title",
            "description",
            "price_from",
            "currency",
            "pricing_note",
            "delivery_mode",
            "country",
            "state",
            "city",
            "area",
        }
        has_activity = instance.message_threads.exists() or instance.booking_requests.exists()
        material_change = bool(material_fields.intersection(serializer.validated_data))
        if has_activity and material_change:
            raise ValidationError(
                "Commercial listing details cannot be rewritten after conversations or bookings exist. "
                "Update availability or deactivate the listing instead."
            )
        if material_change:
            serializer.save(moderation_status=ServiceListing.ModerationStatus.PENDING)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        if instance.provider_id != self.request.user.profile.pk:
            raise PermissionDenied("You cannot delete another professional's listing.")
        if instance.message_threads.exists() or instance.booking_requests.exists():
            raise ValidationError(
                "This listing has conversation or booking history and cannot be deleted. Deactivate it instead."
            )
        instance.delete()


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
            queryset = queryset.filter(
                status=JobPosting.Status.OPEN,
                moderation_status=JobPosting.ModerationStatus.APPROVED,
                category__is_active=True,
            )
        q = self.request.query_params.get("q", "").strip()
        category = self.request.query_params.get("category", "").strip()
        delivery_mode = self.request.query_params.get("delivery_mode", "").strip()
        if q:
            queryset = queryset.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(category__name__icontains=q)
                | Q(subcategory__name__icontains=q)
            )
        if category:
            queryset = queryset.filter(category__slug=category)
        if delivery_mode:
            queryset = queryset.filter(delivery_mode=delivery_mode)
        return _apply_location_filters(queryset, self.request.query_params)

    def perform_create(self, serializer):
        profile = self.request.user.profile
        if self.request.user.role != "client":
            raise PermissionDenied("Only client profiles can create jobs.")
        serializer.save(client=profile, moderation_status=JobPosting.ModerationStatus.PENDING)

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.client_id != self.request.user.profile.pk:
            raise PermissionDenied("You cannot update another client's job.")
        material_fields = {
            "category",
            "subcategory",
            "title",
            "description",
            "budget_min",
            "budget_max",
            "currency",
            "delivery_mode",
            "country",
            "state",
            "city",
            "area",
            "needed_by",
        }
        has_activity = (
            instance.responses.exists()
            or instance.message_threads.exists()
            or instance.bookings.exists()
        )
        material_change = bool(material_fields.intersection(serializer.validated_data))
        if has_activity and material_change:
            raise ValidationError(
                "Job scope, budget and delivery details cannot be rewritten after responses, conversations or bookings exist. "
                "Pause, close or cancel the job instead."
            )
        if material_change:
            serializer.save(moderation_status=JobPosting.ModerationStatus.PENDING)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        if instance.client_id != self.request.user.profile.pk:
            raise PermissionDenied("You cannot delete another client's job.")
        if instance.responses.exists() or instance.message_threads.exists() or instance.bookings.exists():
            raise ValidationError(
                "This job has response, conversation or booking history and cannot be deleted. Close or cancel it instead."
            )
        instance.delete()


class JobResponseViewSet(viewsets.ModelViewSet):
    serializer_class = JobResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        profile = self.request.user.profile
        return JobResponse.objects.select_related(
            "professional__user", "job__client__user", "job__category"
        ).filter(Q(professional=profile) | Q(job__client=profile)).distinct()

    def perform_create(self, serializer):
        serializer.save(professional=self.request.user.profile)

    @action(detail=True, methods=["post"], url_path="decision")
    def decision(self, request, pk=None):
        response = self.get_object()
        if response.job.client_id != request.user.profile.pk:
            raise PermissionDenied("Only the job owner can shortlist or decline responses.")
        decision = JobResponseStatusSerializer(data=request.data)
        decision.is_valid(raise_exception=True)
        target = decision.validated_data["status"]
        allowed = {
            JobResponse.Status.SENT: {JobResponse.Status.SHORTLISTED, JobResponse.Status.DECLINED},
            JobResponse.Status.SHORTLISTED: {JobResponse.Status.DECLINED},
        }
        if target not in allowed.get(response.status, set()):
            raise ValidationError({"status": "This job response can no longer move to that state."})
        response.status = target
        response.save(update_fields=["status", "updated_at"])
        return Response(JobResponseSerializer(response, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def withdraw(self, request, pk=None):
        response = self.get_object()
        if response.professional_id != request.user.profile.pk:
            raise PermissionDenied("Only the professional who submitted this response can withdraw it.")
        if response.status not in {JobResponse.Status.SENT, JobResponse.Status.SHORTLISTED}:
            raise ValidationError({"status": "This job response can no longer be withdrawn."})
        response.status = JobResponse.Status.WITHDRAWN
        response.save(update_fields=["status", "updated_at"])
        return Response(JobResponseSerializer(response, context={"request": request}).data)


class MessageThreadViewSet(viewsets.ModelViewSet):
    serializer_class = ThreadSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        me = self.request.user.profile
        return MessageThread.objects.select_related(
            "client__user", "professional__user", "listing", "job", "job_response"
        ).filter(Q(client=me) | Q(professional=me)).distinct()

    def create(self, request, *args, **kwargs):
        me = request.user.profile
        listing_id = request.data.get("listing_id")
        response_id = request.data.get("job_response_id")
        existing = None
        if request.user.role == "client" and listing_id:
            existing = MessageThread.objects.filter(
                client=me,
                listing_id=listing_id,
                status=MessageThread.Status.OPEN,
            ).first()
        elif request.user.role == "professional" and response_id:
            existing = MessageThread.objects.filter(
                professional=me,
                job_response_id=response_id,
                status=MessageThread.Status.OPEN,
            ).first()
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
            if response.status not in {JobResponse.Status.SENT, JobResponse.Status.SHORTLISTED}:
                raise ValidationError({"job_response_id": "This job response is no longer active."})
            if (
                response.job.status != JobPosting.Status.OPEN
                or response.job.moderation_status != JobPosting.ModerationStatus.APPROVED
            ):
                raise ValidationError({"job_response_id": "The related job is no longer open for conversation."})
            serializer.save(client=response.job.client, professional=me, job=response.job)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        thread = self.get_object()
        now = timezone.now()
        count = thread.messages.filter(is_read=False).exclude(sender=request.user.profile).update(
            is_read=True,
            read_at=now,
        )
        return Response({"marked_read": count})

    @action(detail=True, methods=["post"])
    def block(self, request, pk=None):
        thread = self.get_object()
        me = request.user.profile
        other = thread.professional if me.pk == thread.client_id else thread.client
        block, _ = ConversationBlock.objects.update_or_create(
            blocker=me,
            blocked=other,
            defaults={"thread": thread, "is_active": True},
        )
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
        qs = Message.objects.select_related(
            "thread__client__user", "thread__professional__user", "sender__user"
        ).filter(Q(thread__client=me) | Q(thread__professional=me))
        thread_id = self.request.query_params.get("thread")
        return qs.filter(thread_id=thread_id) if thread_id else qs.none()

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user.profile)
        thread = message.thread
        thread.last_message_at = message.created_at
        thread.save(update_fields=["last_message_at", "updated_at"])
        recipient = thread.professional if message.sender_id == thread.client_id else thread.client
        broadcast_marketplace_event(
            [recipient.user_id],
            "new-message",
            MessageSerializer(message, context={"request": self.request}).data,
        )


class BookingRequestViewSet(viewsets.ModelViewSet):
    serializer_class = BookingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        me = self.request.user.profile
        return BookingRequest.objects.select_related(
            "client__user", "professional__user", "listing", "job", "job_response", "thread"
        ).filter(Q(client=me) | Q(professional=me)).distinct()

    def perform_create(self, serializer):
        thread = serializer.validated_data["thread"]
        booking = serializer.save(
            client=thread.client,
            professional=thread.professional,
            listing=thread.listing,
            job=thread.job,
            job_response=thread.job_response,
        )
        _booking_audit(
            booking,
            self.request.user.profile,
            "booking_created",
            "",
            booking.status,
            {
                "scope": booking.scope_summary,
                "price": str(booking.agreed_price),
                "currency": booking.currency,
            },
        )
        broadcast_marketplace_event(
            [thread.professional.user_id],
            "booking-updated",
            BookingRequestSerializer(booking, context={"request": self.request}).data,
        )

    @action(detail=True, methods=["post"], url_path="status")
    def update_status(self, request, pk=None):
        booking = self.get_object()
        me = request.user.profile
        serializer = BookingStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = serializer.validated_data["status"]
        old = booking.status
        if me.pk == booking.client_id:
            allowed = {
                BookingRequest.Status.PENDING: {BookingRequest.Status.CANCELLED},
                BookingRequest.Status.ACCEPTED: {BookingRequest.Status.CANCELLED, BookingRequest.Status.IN_PROGRESS},
                BookingRequest.Status.IN_PROGRESS: {BookingRequest.Status.COMPLETED},
            }
        elif me.pk == booking.professional_id:
            allowed = {
                BookingRequest.Status.PENDING: {BookingRequest.Status.ACCEPTED, BookingRequest.Status.DECLINED},
                BookingRequest.Status.ACCEPTED: {BookingRequest.Status.CANCELLED, BookingRequest.Status.IN_PROGRESS},
                BookingRequest.Status.IN_PROGRESS: {BookingRequest.Status.COMPLETED},
            }
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
        broadcast_marketplace_event(
            [other.user_id],
            "booking-updated",
            BookingRequestSerializer(booking, context={"request": request}).data,
        )
        return Response(BookingRequestSerializer(booking, context={"request": request}).data)


class ScheduleProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        me = self.request.user.profile
        return ScheduleProposal.objects.select_related(
            "booking__client", "booking__professional", "proposer"
        ).filter(Q(booking__client=me) | Q(booking__professional=me)).distinct()

    def perform_create(self, serializer):
        booking = serializer.validated_data["booking"]
        me = self.request.user.profile
        ScheduleProposal.objects.filter(
            booking=booking,
            status=ScheduleProposal.Status.PROPOSED,
        ).update(status=ScheduleProposal.Status.SUPERSEDED)
        proposal = serializer.save(proposer=me)
        booking.schedule_status = BookingRequest.ScheduleStatus.PROPOSED
        booking.save(update_fields=["schedule_status", "updated_at"])
        _booking_audit(
            booking,
            me,
            "schedule_proposed",
            metadata={
                "proposal_id": str(proposal.id),
                "proposed_for": proposal.proposed_for.isoformat(),
                "timezone": proposal.timezone,
            },
        )
        other = _other_participant(booking, me)
        broadcast_marketplace_event(
            [other.user_id],
            "schedule-updated",
            ScheduleProposalSerializer(proposal, context={"request": self.request}).data,
        )

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
        _booking_audit(
            booking,
            me,
            "schedule_decision",
            metadata={"proposal_id": str(proposal.id), "decision": target},
        )
        other = _other_participant(booking, me)
        broadcast_marketplace_event(
            [other.user_id],
            "schedule-updated",
            ScheduleProposalSerializer(proposal, context={"request": request}).data,
        )
        return Response(ScheduleProposalSerializer(proposal, context={"request": request}).data)