import os
import re

from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from profiles.models import Profile
from profiles.serializers import ProfileSerializer

from .markets import country_name_for_code, default_currency_for_country, normalise_country_code, supported_currency
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
    ServiceArea,
    ServiceCategory,
    ServiceListing,
    ServiceSubcategory,
)

CONTACT_RE = re.compile(r"(?:\+?\d[\d\s().-]{7,}\d)|(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})", re.I)
ALLOWED_ATTACHMENT_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"}
ALLOWED_ATTACHMENT_EXTENSIONS = {
    "image/jpeg": {".jpg", ".jpeg"}, "image/png": {".png"}, "image/webp": {".webp"},
    "application/pdf": {".pdf"}, "text/plain": {".txt"},
}
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024


def _normalise_location_currency(attrs, instance=None):
    country_code = normalise_country_code(attrs.get("country_code") or attrs.get("country") or getattr(instance, "country_code", "") or getattr(instance, "country", ""))
    if country_code:
        attrs["country_code"] = country_code
        if not (attrs.get("country") or getattr(instance, "country", "")):
            attrs["country"] = country_name_for_code(country_code)
    currency = (attrs.get("currency") or getattr(instance, "currency", "") or "").strip().upper()
    if not currency:
        currency = default_currency_for_country(country_code)
    if not supported_currency(currency):
        raise serializers.ValidationError({"currency": "Use a three-letter ISO currency code."})
    attrs["currency"] = currency
    return attrs


class ServiceSubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceSubcategory
        fields = ["id", "name", "slug"]


class ServiceCategorySerializer(serializers.ModelSerializer):
    subcategories = ServiceSubcategorySerializer(many=True, read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "slug", "description", "icon", "subcategories"]


class ServiceAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceArea
        fields = ["id", "country_code", "state", "city", "area", "postcode", "latitude", "longitude", "radius_km"]
        read_only_fields = ["id"]

    def validate_country_code(self, value):
        code = normalise_country_code(value)
        if not code:
            raise serializers.ValidationError("Use a two-letter ISO country code.")
        return code


class ServiceListingSerializer(serializers.ModelSerializer):
    provider = ProfileSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    subcategory = ServiceSubcategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(source="category", queryset=ServiceCategory.objects.filter(is_active=True), write_only=True)
    subcategory_id = serializers.PrimaryKeyRelatedField(source="subcategory", queryset=ServiceSubcategory.objects.filter(is_active=True), write_only=True, required=False, allow_null=True)
    service_areas = ServiceAreaSerializer(many=True, required=False)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = ServiceListing
        fields = [
            "id", "provider", "category", "category_id", "subcategory", "subcategory_id",
            "title", "description", "price_from", "currency", "pricing_note", "delivery_mode",
            "country", "country_code", "state", "city", "area", "postcode", "latitude", "longitude", "service_radius_km",
            "service_areas", "distance_km", "availability_text", "available_now", "moderation_status", "is_featured", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "provider", "moderation_status", "is_featured", "distance_km", "created_at", "updated_at"]

    def get_distance_km(self, obj):
        value = getattr(obj, "distance_km", None)
        return round(float(value), 2) if value is not None else None

    def validate_price_from(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        subcategory = attrs.get("subcategory")
        if subcategory and category and subcategory.category_id != category.id:
            raise serializers.ValidationError({"subcategory_id": "Subcategory must belong to the selected category."})
        attrs = _normalise_location_currency(attrs, self.instance)
        delivery_mode = attrs.get("delivery_mode") or getattr(self.instance, "delivery_mode", ServiceListing.DeliveryMode.IN_PERSON)
        if delivery_mode != ServiceListing.DeliveryMode.REMOTE and not attrs.get("country_code") and not getattr(self.instance, "country_code", ""):
            raise serializers.ValidationError({"country_code": "In-person services need a service country."})
        return attrs

    def create(self, validated_data):
        areas = validated_data.pop("service_areas", [])
        listing = super().create(validated_data)
        ServiceArea.objects.bulk_create([ServiceArea(listing=listing, **area) for area in areas])
        return listing

    def update(self, instance, validated_data):
        areas = validated_data.pop("service_areas", None)
        listing = super().update(instance, validated_data)
        if areas is not None:
            listing.service_areas.all().delete()
            ServiceArea.objects.bulk_create([ServiceArea(listing=listing, **area) for area in areas])
        return listing


class JobPostingSerializer(serializers.ModelSerializer):
    client = ProfileSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    subcategory = ServiceSubcategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(source="category", queryset=ServiceCategory.objects.filter(is_active=True), write_only=True)
    subcategory_id = serializers.PrimaryKeyRelatedField(source="subcategory", queryset=ServiceSubcategory.objects.filter(is_active=True), write_only=True, required=False, allow_null=True)
    response_count = serializers.IntegerField(source="responses.count", read_only=True)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = JobPosting
        fields = [
            "id", "client", "category", "category_id", "subcategory", "subcategory_id", "title", "description",
            "budget_min", "budget_max", "currency", "delivery_mode", "country", "country_code", "state", "city", "area", "postcode",
            "latitude", "longitude", "search_radius_km", "distance_km", "needed_by", "status", "moderation_status", "response_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "client", "moderation_status", "response_count", "distance_km", "created_at", "updated_at"]

    def get_distance_km(self, obj):
        value = getattr(obj, "distance_km", None)
        return round(float(value), 2) if value is not None else None

    def validate(self, attrs):
        minimum, maximum = attrs.get("budget_min"), attrs.get("budget_max")
        if minimum is not None and maximum is not None and minimum > maximum:
            raise serializers.ValidationError({"budget_max": "Maximum budget must be greater than or equal to minimum budget."})
        category = attrs.get("category") or getattr(self.instance, "category", None)
        subcategory = attrs.get("subcategory")
        if subcategory and category and subcategory.category_id != category.id:
            raise serializers.ValidationError({"subcategory_id": "Subcategory must belong to the selected category."})
        attrs = _normalise_location_currency(attrs, self.instance)
        delivery_mode = attrs.get("delivery_mode") or getattr(self.instance, "delivery_mode", ServiceListing.DeliveryMode.IN_PERSON)
        if delivery_mode != ServiceListing.DeliveryMode.REMOTE and not attrs.get("country_code") and not getattr(self.instance, "country_code", ""):
            raise serializers.ValidationError({"country_code": "In-person jobs need a service country."})
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
        request, job = self.context.get("request"), attrs.get("job")
        if job:
            currency = (attrs.get("currency") or job.currency).strip().upper()
            if not supported_currency(currency):
                raise serializers.ValidationError({"currency": "Use a three-letter ISO currency code."})
            attrs["currency"] = currency
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


class ThreadSerializer(serializers.ModelSerializer):
    client = ProfileSerializer(read_only=True)
    professional = ProfileSerializer(read_only=True)
    professional_id = serializers.PrimaryKeyRelatedField(source="professional", queryset=Profile.objects.filter(role="professional"), write_only=True, required=False)
    listing_id = serializers.PrimaryKeyRelatedField(source="listing", queryset=ServiceListing.objects.filter(is_active=True, moderation_status=ServiceListing.ModerationStatus.APPROVED), write_only=True, required=False, allow_null=True)
    job_response_id = serializers.PrimaryKeyRelatedField(source="job_response", queryset=JobResponse.objects.all(), write_only=True, required=False, allow_null=True)
    unread_count = serializers.SerializerMethodField()
    booking_id = serializers.SerializerMethodField()
    is_blocked_by_me = serializers.SerializerMethodField()
    is_blocked_by_other = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = ["id", "client", "professional", "professional_id", "listing_id", "job", "job_response_id", "status", "last_message_at", "unread_count", "booking_id", "is_blocked_by_me", "is_blocked_by_other", "created_at", "updated_at"]
        read_only_fields = ["id", "client", "job", "status", "last_message_at", "created_at", "updated_at"]

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user.profile).count()

    def get_booking_id(self, obj):
        try:
            return str(obj.booking.id)
        except BookingRequest.DoesNotExist:
            return None

    def _participants(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None, None
        me = request.user.profile
        if me.pk not in obj.participant_ids():
            return None, None
        other = obj.professional if me.pk == obj.client_id else obj.client
        return me, other

    def get_is_blocked_by_me(self, obj):
        me, other = self._participants(obj)
        return bool(me and other and ConversationBlock.objects.filter(blocker=me, blocked=other, is_active=True).exists())

    def get_is_blocked_by_other(self, obj):
        me, other = self._participants(obj)
        return bool(me and other and ConversationBlock.objects.filter(blocker=other, blocked=me, is_active=True).exists())

    def validate(self, attrs):
        request = self.context["request"]
        me = request.user.profile
        listing, professional, job_response = attrs.get("listing"), attrs.get("professional"), attrs.get("job_response")
        if me.role == "client":
            target = listing.provider if listing else professional
            if not target or target.role != "professional":
                raise serializers.ValidationError("Choose a professional or approved service listing.")
            if target.pk == me.pk:
                raise serializers.ValidationError("You cannot message yourself.")
            if job_response:
                raise serializers.ValidationError("Clients cannot initiate from a professional job response.")
            duplicate = MessageThread.objects.filter(client=me, professional=target, status=MessageThread.Status.OPEN)
            if listing:
                duplicate = duplicate.filter(listing=listing)
            if duplicate.exists():
                raise serializers.ValidationError({"existing_thread_id": str(duplicate.first().id)})
        elif me.role == "professional":
            if not job_response or job_response.professional_id != me.pk:
                raise serializers.ValidationError("Professionals start job conversations from their own job response.")
            duplicate = MessageThread.objects.filter(job_response=job_response, professional=me, status=MessageThread.Status.OPEN).first()
            if duplicate:
                raise serializers.ValidationError({"existing_thread_id": str(duplicate.id)})
        else:
            raise serializers.ValidationError("A marketplace role is required.")
        return attrs


class MessageSerializer(serializers.ModelSerializer):
    sender = ProfileSerializer(read_only=True)
    thread_id = serializers.PrimaryKeyRelatedField(source="thread", queryset=MessageThread.objects.all(), write_only=True)

    class Meta:
        model = Message
        fields = ["id", "thread_id", "thread", "sender", "body", "attachment", "attachment_name", "attachment_content_type", "attachment_size", "is_read", "read_at", "is_system", "created_at"]
        read_only_fields = ["id", "thread", "sender", "attachment_name", "attachment_content_type", "attachment_size", "is_read", "read_at", "is_system", "created_at"]

    def validate_attachment(self, value):
        if not value:
            return value
        if value.size > MAX_ATTACHMENT_SIZE:
            raise serializers.ValidationError("Attachment must be 10 MB or smaller.")
        content_type = getattr(value, "content_type", "")
        if content_type not in ALLOWED_ATTACHMENT_TYPES:
            raise serializers.ValidationError("Unsupported attachment type.")
        filename = os.path.basename(str(getattr(value, "name", "") or ""))
        extension = os.path.splitext(filename)[1].lower()
        if extension not in ALLOWED_ATTACHMENT_EXTENSIONS.get(content_type, set()):
            raise serializers.ValidationError("Attachment filename does not match its declared file type.")
        return value

    def validate(self, attrs):
        request = self.context["request"]
        me, thread = request.user.profile, attrs.get("thread")
        if me.pk not in thread.participant_ids():
            raise serializers.ValidationError("You are not a participant in this conversation.")
        if thread.status != MessageThread.Status.OPEN:
            raise serializers.ValidationError("This conversation is closed.")
        other = thread.professional if me.pk == thread.client_id else thread.client
        if ConversationBlock.objects.filter(Q(blocker=me, blocked=other) | Q(blocker=other, blocked=me), is_active=True).exists():
            raise serializers.ValidationError("Messaging is restricted because one participant has blocked the other.")
        body = (attrs.get("body") or "").strip()
        if not body and not attrs.get("attachment"):
            raise serializers.ValidationError("Add a message or attachment.")
        if getattr(settings, "PREBOOKING_CONTACT_BLOCK_ENABLED", True) and body and CONTACT_RE.search(body):
            accepted_booking_exists = BookingRequest.objects.filter(thread=thread, status__in=[BookingRequest.Status.ACCEPTED, BookingRequest.Status.IN_PROGRESS, BookingRequest.Status.COMPLETED]).exists()
            if not accepted_booking_exists:
                raise serializers.ValidationError("Contact details cannot be shared before a booking is accepted.")
        attrs["body"] = body
        return attrs

    def create(self, validated_data):
        attachment = validated_data.get("attachment")
        if attachment:
            safe_name = os.path.basename(str(attachment.name or "attachment"))[:255]
            validated_data["attachment_name"] = safe_name
            validated_data["attachment_content_type"] = getattr(attachment, "content_type", "")
            validated_data["attachment_size"] = attachment.size
        return super().create(validated_data)


class ConversationReportSerializer(serializers.ModelSerializer):
    message_id = serializers.PrimaryKeyRelatedField(source="message", queryset=Message.objects.all(), write_only=True, required=False, allow_null=True)

    class Meta:
        model = ConversationReport
        fields = ["id", "thread", "reporter", "reported_user", "message_id", "reason", "details", "status", "created_at"]
        read_only_fields = ["id", "thread", "reporter", "reported_user", "status", "created_at"]

    def create(self, validated_data):
        unresolved = ConversationReport.objects.filter(thread=validated_data.get("thread"), reporter=validated_data.get("reporter"), status__in=[ConversationReport.Status.OPEN, ConversationReport.Status.REVIEWED])
        if unresolved.exists():
            raise serializers.ValidationError("You already have an unresolved report for this conversation.")
        return super().create(validated_data)


class BookingRequestSerializer(serializers.ModelSerializer):
    client = ProfileSerializer(read_only=True)
    professional = ProfileSerializer(read_only=True)
    thread_id = serializers.PrimaryKeyRelatedField(source="thread", queryset=MessageThread.objects.all(), write_only=True)
    schedule_proposals = serializers.SerializerMethodField()
    audit_events = serializers.SerializerMethodField()

    class Meta:
        model = BookingRequest
        fields = ["id", "thread_id", "thread", "listing", "job", "job_response", "client", "professional", "scope_summary", "agreed_price", "currency", "requested_for", "timezone", "schedule_status", "message", "status", "accepted_at", "schedule_proposals", "audit_events", "created_at", "updated_at"]
        read_only_fields = ["id", "thread", "listing", "job", "job_response", "client", "professional", "status", "accepted_at", "schedule_proposals", "audit_events", "created_at", "updated_at"]

    def get_schedule_proposals(self, obj):
        return ScheduleProposalSerializer(obj.schedule_proposals.all(), many=True).data

    def get_audit_events(self, obj):
        return BookingAuditSerializer(obj.audit_events.all(), many=True).data

    def validate(self, attrs):
        request, thread = self.context["request"], attrs.get("thread")
        if request.user.profile.pk != thread.client_id:
            raise serializers.ValidationError("Only the client can create the booking agreement.")
        if BookingRequest.objects.filter(thread=thread).exists():
            raise serializers.ValidationError("This conversation already has a booking agreement.")
        scope = (attrs.get("scope_summary") or "").strip()
        if not scope:
            raise serializers.ValidationError({"scope_summary": "Agreed scope is required."})
        price = attrs.get("agreed_price")
        if price is None or price < 0:
            raise serializers.ValidationError({"agreed_price": "A non-negative agreed price is required."})
        contextual_currency = ""
        if thread.listing_id:
            contextual_currency = thread.listing.currency
        elif thread.job_id:
            contextual_currency = thread.job.currency
        currency = (attrs.get("currency") or contextual_currency).strip().upper()
        if not supported_currency(currency):
            raise serializers.ValidationError({"currency": "Use a three-letter ISO currency code."})
        attrs["scope_summary"] = scope
        attrs["currency"] = currency
        return attrs


class BookingStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=BookingRequest.Status.choices)


class ScheduleProposalSerializer(serializers.ModelSerializer):
    proposer = ProfileSerializer(read_only=True)
    booking_id = serializers.PrimaryKeyRelatedField(source="booking", queryset=BookingRequest.objects.all(), write_only=True)

    class Meta:
        model = ScheduleProposal
        fields = ["id", "booking_id", "booking", "proposer", "proposed_for", "timezone", "note", "status", "responded_at", "created_at"]
        read_only_fields = ["id", "booking", "proposer", "status", "responded_at", "created_at"]

    def validate(self, attrs):
        me, booking = self.context["request"].user.profile, attrs["booking"]
        if me.pk not in {booking.client_id, booking.professional_id}:
            raise serializers.ValidationError("You are not part of this booking.")
        if booking.status not in {BookingRequest.Status.ACCEPTED, BookingRequest.Status.IN_PROGRESS}:
            raise serializers.ValidationError("The booking must be accepted before scheduling.")
        if attrs["proposed_for"] <= timezone.now():
            raise serializers.ValidationError({"proposed_for": "Schedule must be in the future."})
        timezone_name = (attrs.get("timezone") or "UTC").strip()
        if len(timezone_name) > 64:
            raise serializers.ValidationError({"timezone": "Timezone is too long."})
        return attrs


class ScheduleDecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[ScheduleProposal.Status.ACCEPTED, ScheduleProposal.Status.DECLINED])


class BookingAuditSerializer(serializers.ModelSerializer):
    actor = ProfileSerializer(read_only=True)

    class Meta:
        model = BookingAudit
        fields = ["id", "actor", "event", "from_status", "to_status", "metadata", "created_at"]
