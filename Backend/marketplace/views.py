from django.db.models import Q
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import BookingRequest, JobPosting, JobResponse, ServiceCategory, ServiceListing
from .permissions import IsListingOwnerOrReadOnly
from .serializers import (
    BookingRequestSerializer,
    BookingStatusSerializer,
    JobPostingSerializer,
    JobResponseSerializer,
    JobResponseStatusSerializer,
    ServiceCategorySerializer,
    ServiceListingSerializer,
)


def _apply_location_filters(queryset, params):
    country = params.get("country", "").strip()
    state_value = params.get("state", "").strip()
    city = params.get("city", "").strip()
    area = params.get("area", "").strip()
    if country:
        queryset = queryset.filter(country__iexact=country)
    if state_value:
        queryset = queryset.filter(state__iexact=state_value)
    if city:
        queryset = queryset.filter(city__icontains=city)
    if area:
        queryset = queryset.filter(area__icontains=area)
    return queryset


class ServiceCategoryViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = ServiceCategory.objects.filter(is_active=True).prefetch_related("subcategories")
    lookup_field = "slug"


class ServiceListingViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceListingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsListingOwnerOrReadOnly]

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
        if profile.role != "professional":
            raise PermissionDenied("Only professional profiles can publish service listings.")
        serializer.save(provider=profile, moderation_status=ServiceListing.ModerationStatus.PENDING)

    def perform_update(self, serializer):
        if serializer.instance.provider_id != self.request.user.profile.pk:
            raise PermissionDenied("You cannot update another professional's listing.")
        serializer.save(moderation_status=ServiceListing.ModerationStatus.PENDING)


class JobPostingViewSet(viewsets.ModelViewSet):
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

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
        if profile.role != "client":
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
        return (
            JobResponse.objects
            .select_related("professional__user", "job__client__user", "job__category")
            .filter(Q(professional=profile) | Q(job__client=profile))
            .distinct()
        )

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


class BookingRequestViewSet(viewsets.ModelViewSet):
    serializer_class = BookingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        profile = self.request.user.profile
        return (
            BookingRequest.objects
            .select_related("client__user", "listing__provider__user", "listing__category")
            .filter(Q(client=profile) | Q(listing__provider=profile))
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(client=self.request.user.profile)

    @action(detail=True, methods=["post"], url_path="status")
    def update_status(self, request, pk=None):
        booking = self.get_object()
        serializer = BookingStatusSerializer(data=request.data, context={"request": request, "booking": booking})
        serializer.is_valid(raise_exception=True)
        booking.status = serializer.validated_data["status"]
        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingRequestSerializer(booking, context={"request": request}).data, status=status.HTTP_200_OK)
