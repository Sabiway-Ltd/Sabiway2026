from django.db.models import Q
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import BookingRequest, ServiceCategory, ServiceListing
from .permissions import IsListingOwnerOrReadOnly
from .serializers import (
    BookingRequestSerializer,
    BookingStatusSerializer,
    ServiceCategorySerializer,
    ServiceListingSerializer,
)


class ServiceCategoryViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = ServiceCategory.objects.filter(is_active=True)
    lookup_field = "slug"


class ServiceListingViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceListingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsListingOwnerOrReadOnly]

    def get_queryset(self):
        queryset = ServiceListing.objects.select_related("provider__user", "category")
        if self.request.user.is_authenticated and self.request.query_params.get("mine") == "1":
            queryset = queryset.filter(provider=self.request.user.profile)
        else:
            queryset = queryset.filter(is_active=True, category__is_active=True)

        q = self.request.query_params.get("q", "").strip()
        category = self.request.query_params.get("category", "").strip()
        state = self.request.query_params.get("state", "").strip()
        area = self.request.query_params.get("area", "").strip()
        delivery_mode = self.request.query_params.get("delivery_mode", "").strip()

        if q:
            queryset = queryset.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(provider__full_name__icontains=q)
                | Q(provider__job__icontains=q)
            )
        if category:
            queryset = queryset.filter(category__slug=category)
        if state:
            queryset = queryset.filter(state__iexact=state)
        if area:
            queryset = queryset.filter(area__icontains=area)
        if delivery_mode:
            queryset = queryset.filter(delivery_mode=delivery_mode)
        return queryset

    def perform_create(self, serializer):
        profile = self.request.user.profile
        if profile.role != "professional":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only professional profiles can publish service listings.")
        serializer.save(provider=profile)


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
        serializer = BookingStatusSerializer(
            data=request.data,
            context={"request": request, "booking": booking},
        )
        serializer.is_valid(raise_exception=True)
        booking.status = serializer.validated_data["status"]
        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingRequestSerializer(booking, context={"request": request}).data, status=status.HTTP_200_OK)
