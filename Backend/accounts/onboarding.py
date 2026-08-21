from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from marketplace.models import ServiceCategory, ServiceListing
from marketplace.serializers import ServiceListingSerializer
from profiles.models import Profile
from profiles.serializers import ProfileSerializer

from .identity import normalise_phone_number
from .models import User
from .serializers import ClientOnboardingSerializer, UserSerializer


class ProfessionalOnboardingSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=32)
    professional_summary = serializers.CharField(max_length=1000)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=ServiceCategory.objects.filter(is_active=True),
    )
    service_title = serializers.CharField(max_length=160)
    service_description = serializers.CharField(max_length=3000)
    price_from = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    currency = serializers.ChoiceField(choices=["NGN", "GBP"])
    delivery_mode = serializers.ChoiceField(choices=ServiceListing.DeliveryMode.choices)
    country = serializers.CharField(required=False, allow_blank=True, max_length=100)
    state = serializers.CharField(required=False, allow_blank=True, max_length=100)
    city = serializers.CharField(required=False, allow_blank=True, max_length=120)
    area = serializers.CharField(required=False, allow_blank=True, max_length=120)
    availability_text = serializers.CharField(required=False, allow_blank=True, max_length=160)
    available_now = serializers.BooleanField(default=False)

    def validate_full_name(self, value):
        normalized = value.strip()
        if len(normalized) < 2:
            raise serializers.ValidationError("Enter your full name.")
        return normalized

    def validate_phone_number(self, value):
        return normalise_phone_number(value)

    def validate_professional_summary(self, value):
        normalized = value.strip()
        if len(normalized) < 40:
            raise serializers.ValidationError("Add a short professional summary of at least 40 characters.")
        return normalized

    def validate_service_title(self, value):
        normalized = value.strip()
        if len(normalized) < 5:
            raise serializers.ValidationError("Describe the service you offer.")
        return normalized

    def validate_service_description(self, value):
        normalized = value.strip()
        if len(normalized) < 40:
            raise serializers.ValidationError("Describe your service in at least 40 characters.")
        return normalized

    def validate(self, attrs):
        attrs = super().validate(attrs)
        for field in ["country", "state", "city", "area", "availability_text"]:
            attrs[field] = (attrs.get(field) or "").strip()
        if attrs["delivery_mode"] in {ServiceListing.DeliveryMode.IN_PERSON, ServiceListing.DeliveryMode.BOTH} and len(attrs["country"]) < 2:
            raise serializers.ValidationError({"country": "Enter the country where you provide in-person services."})
        return attrs


class ClientOnboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.CLIENT:
            return Response(
                {"detail": "Client onboarding is only available to Client accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile = Profile.objects.get(user=request.user)
        return Response(
            {
                "user": UserSerializer(request.user).data,
                "profile": ProfileSerializer(profile, context={"request": request}).data,
            }
        )

    def post(self, request):
        if request.user.role != User.Role.CLIENT:
            return Response(
                {"detail": "Client onboarding is only available to Client accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ClientOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            user = request.user
            user.full_name = data["full_name"]
            user.phone_number = data.get("phone_number", "")
            if not user.onboarding_completed_at:
                user.onboarding_completed_at = timezone.now()
            user.save(update_fields=["full_name", "phone_number", "onboarding_completed_at"])

            profile = Profile.objects.select_for_update().get(user=user)
            profile.phone_number = user.phone_number
            profile.country = data["country"]
            profile.state = data.get("state", "")
            profile.area = data.get("area", "")
            profile.save(update_fields=[
                "full_name", "initials", "phone_number", "country", "state", "area", "address", "role", "updated_at"
            ])

        user.refresh_from_db()
        profile.refresh_from_db()
        return Response(
            {
                "user": UserSerializer(user).data,
                "profile": ProfileSerializer(profile, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


class ProfessionalOnboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _role_denied(self):
        return Response(
            {"detail": "Professional onboarding is only available to Professional accounts."},
            status=status.HTTP_403_FORBIDDEN,
        )

    def get(self, request):
        if request.user.role != User.Role.PROFESSIONAL:
            return self._role_denied()
        profile = Profile.objects.get(user=request.user)
        draft = ServiceListing.objects.filter(
            provider=profile,
            moderation_status=ServiceListing.ModerationStatus.DRAFT,
        ).select_related("category", "subcategory", "provider__user").order_by("created_at").first()
        return Response(
            {
                "user": UserSerializer(request.user).data,
                "profile": ProfileSerializer(profile, context={"request": request}).data,
                "draft_service": ServiceListingSerializer(draft, context={"request": request}).data if draft else None,
            }
        )

    def post(self, request):
        if request.user.role != User.Role.PROFESSIONAL:
            return self._role_denied()

        serializer = ProfessionalOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            user = request.user
            user.full_name = data["full_name"]
            user.phone_number = data.get("phone_number", "")
            if not user.onboarding_completed_at:
                user.onboarding_completed_at = timezone.now()
            user.save(update_fields=["full_name", "phone_number", "onboarding_completed_at"])

            profile = Profile.objects.select_for_update().get(user=user)
            profile.phone_number = user.phone_number
            profile.bio = data["professional_summary"]
            profile.job = data["category"].name
            profile.country = data.get("country", "")
            profile.state = data.get("state", "")
            profile.area = data.get("area", "")
            profile.save(update_fields=[
                "full_name", "initials", "phone_number", "bio", "job", "country", "state", "area", "address", "role", "updated_at"
            ])

            listing = ServiceListing.objects.select_for_update().filter(
                provider=profile,
                moderation_status=ServiceListing.ModerationStatus.DRAFT,
            ).order_by("created_at").first()
            if listing is None:
                listing = ServiceListing(provider=profile, moderation_status=ServiceListing.ModerationStatus.DRAFT)

            listing.category = data["category"]
            listing.subcategory = None
            listing.title = data["service_title"]
            listing.description = data["service_description"]
            listing.price_from = data["price_from"]
            listing.currency = data["currency"]
            listing.delivery_mode = data["delivery_mode"]
            listing.country = data.get("country", "")
            listing.state = data.get("state", "")
            listing.city = data.get("city", "")
            listing.area = data.get("area", "")
            listing.availability_text = data.get("availability_text", "")
            listing.available_now = data.get("available_now", False)
            listing.is_active = True
            listing.moderation_status = ServiceListing.ModerationStatus.DRAFT
            listing.save()

        user.refresh_from_db()
        profile.refresh_from_db()
        listing.refresh_from_db()
        return Response(
            {
                "user": UserSerializer(user).data,
                "profile": ProfileSerializer(profile, context={"request": request}).data,
                "draft_service": ServiceListingSerializer(listing, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )
