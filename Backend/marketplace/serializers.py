from rest_framework import serializers

from profiles.serializers import ProfileSerializer

from .models import BookingRequest, ServiceCategory, ServiceListing


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "slug", "description"]


class ServiceListingSerializer(serializers.ModelSerializer):
    provider = ProfileSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=ServiceCategory.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = ServiceListing
        fields = [
            "id", "provider", "category", "category_id", "title", "description",
            "price_from", "currency", "delivery_mode", "state", "area", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "provider", "created_at", "updated_at"]

    def validate_price_from(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value


class BookingRequestSerializer(serializers.ModelSerializer):
    listing_summary = serializers.SerializerMethodField()
    client = ProfileSerializer(read_only=True)
    listing_id = serializers.PrimaryKeyRelatedField(
        source="listing",
        queryset=ServiceListing.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = BookingRequest
        fields = [
            "id", "listing_id", "listing_summary", "client", "requested_for",
            "message", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "client", "status", "created_at", "updated_at"]

    def get_listing_summary(self, obj):
        return {
            "id": str(obj.listing_id),
            "title": obj.listing.title,
            "provider": obj.listing.provider.username,
            "price_from": str(obj.listing.price_from),
            "currency": obj.listing.currency,
        }

    def validate(self, attrs):
        request = self.context.get("request")
        listing = attrs.get("listing")
        if request and listing and request.user.is_authenticated:
            profile = request.user.profile
            if listing.provider_id == profile.pk:
                raise serializers.ValidationError("You cannot book your own service listing.")
        return attrs


class BookingStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=BookingRequest.Status.choices)

    def validate_status(self, value):
        booking = self.context["booking"]
        request = self.context["request"]
        profile = request.user.profile

        if profile.pk == booking.client_id:
            if value != BookingRequest.Status.CANCELLED:
                raise serializers.ValidationError("Clients can only cancel their own booking request.")
            if booking.status not in [BookingRequest.Status.PENDING, BookingRequest.Status.ACCEPTED]:
                raise serializers.ValidationError("This booking can no longer be cancelled.")
            return value

        if profile.pk == booking.listing.provider_id:
            allowed = {
                BookingRequest.Status.PENDING: {BookingRequest.Status.ACCEPTED, BookingRequest.Status.DECLINED},
                BookingRequest.Status.ACCEPTED: {BookingRequest.Status.COMPLETED},
            }
            if value not in allowed.get(booking.status, set()):
                raise serializers.ValidationError("Invalid provider status transition.")
            return value

        raise serializers.ValidationError("You cannot update this booking request.")
