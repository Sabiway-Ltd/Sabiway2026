from rest_framework import serializers

from profiles.serializers import ProfileSerializer

from .models import (
    BookingRequest,
    JobPosting,
    JobResponse,
    ServiceCategory,
    ServiceListing,
    ServiceSubcategory,
)


class ServiceSubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceSubcategory
        fields = ["id", "name", "slug"]


class ServiceCategorySerializer(serializers.ModelSerializer):
    subcategories = ServiceSubcategorySerializer(many=True, read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "slug", "description", "icon", "subcategories"]


class ServiceListingSerializer(serializers.ModelSerializer):
    provider = ProfileSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    subcategory = ServiceSubcategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=ServiceCategory.objects.filter(is_active=True),
        write_only=True,
    )
    subcategory_id = serializers.PrimaryKeyRelatedField(
        source="subcategory",
        queryset=ServiceSubcategory.objects.filter(is_active=True),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ServiceListing
        fields = [
            "id", "provider", "category", "category_id", "subcategory", "subcategory_id",
            "title", "description", "price_from", "currency", "pricing_note",
            "delivery_mode", "country", "state", "city", "area",
            "availability_text", "available_now", "moderation_status", "is_featured",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "provider", "moderation_status", "is_featured", "created_at", "updated_at"]

    def validate_price_from(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        subcategory = attrs.get("subcategory")
        if subcategory and category and subcategory.category_id != category.id:
            raise serializers.ValidationError({"subcategory_id": "Subcategory must belong to the selected category."})
        return attrs


class JobPostingSerializer(serializers.ModelSerializer):
    client = ProfileSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    subcategory = ServiceSubcategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(source="category", queryset=ServiceCategory.objects.filter(is_active=True), write_only=True)
    subcategory_id = serializers.PrimaryKeyRelatedField(source="subcategory", queryset=ServiceSubcategory.objects.filter(is_active=True), write_only=True, required=False, allow_null=True)
    response_count = serializers.IntegerField(source="responses.count", read_only=True)

    class Meta:
        model = JobPosting
        fields = [
            "id", "client", "category", "category_id", "subcategory", "subcategory_id",
            "title", "description", "budget_min", "budget_max", "currency", "delivery_mode",
            "country", "state", "city", "area", "needed_by", "status", "moderation_status",
            "response_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "client", "moderation_status", "response_count", "created_at", "updated_at"]

    def validate(self, attrs):
        minimum = attrs.get("budget_min")
        maximum = attrs.get("budget_max")
        if minimum is not None and maximum is not None and minimum > maximum:
            raise serializers.ValidationError({"budget_max": "Maximum budget must be greater than or equal to minimum budget."})
        category = attrs.get("category") or getattr(self.instance, "category", None)
        subcategory = attrs.get("subcategory")
        if subcategory and category and subcategory.category_id != category.id:
            raise serializers.ValidationError({"subcategory_id": "Subcategory must belong to the selected category."})
        return attrs


class JobResponseSerializer(serializers.ModelSerializer):
    professional = ProfileSerializer(read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(source="job", queryset=JobPosting.objects.filter(status=JobPosting.Status.OPEN, moderation_status=JobPosting.ModerationStatus.APPROVED), write_only=True)

    class Meta:
        model = JobResponse
        fields = ["id", "job_id", "job_title", "professional", "message", "proposed_price", "currency", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "professional", "status", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        job = attrs.get("job")
        if request and request.user.is_authenticated:
            profile = request.user.profile
            if profile.role != "professional":
                raise serializers.ValidationError("Only professional profiles can respond to jobs.")
            if job and job.client_id == profile.pk:
                raise serializers.ValidationError("You cannot respond to your own job.")
            if job and JobResponse.objects.filter(job=job, professional=profile).exists():
                raise serializers.ValidationError("You have already responded to this job.")
        return attrs


class JobResponseStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[JobResponse.Status.SHORTLISTED, JobResponse.Status.DECLINED])


class BookingRequestSerializer(serializers.ModelSerializer):
    listing_summary = serializers.SerializerMethodField()
    client = ProfileSerializer(read_only=True)
    listing_id = serializers.PrimaryKeyRelatedField(source="listing", queryset=ServiceListing.objects.filter(is_active=True), write_only=True)

    class Meta:
        model = BookingRequest
        fields = ["id", "listing_id", "listing_summary", "client", "requested_for", "message", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "client", "status", "created_at", "updated_at"]

    def get_listing_summary(self, obj):
        return {"id": str(obj.listing_id), "title": obj.listing.title, "provider": obj.listing.provider.username, "price_from": str(obj.listing.price_from), "currency": obj.listing.currency}

    def validate(self, attrs):
        request = self.context.get("request")
        listing = attrs.get("listing")
        if request and listing and request.user.is_authenticated and listing.provider_id == request.user.profile.pk:
            raise serializers.ValidationError("You cannot book your own service listing.")
        return attrs


class BookingStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=BookingRequest.Status.choices)

    def validate_status(self, value):
        booking = self.context["booking"]
        profile = self.context["request"].user.profile
        if profile.pk == booking.client_id:
            if value != BookingRequest.Status.CANCELLED:
                raise serializers.ValidationError("Clients can only cancel their own booking request.")
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
