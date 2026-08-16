from rest_framework import serializers

from marketplace.models import BookingRequest
from profiles.serializers import ProfileSerializer

from .models import PaymentAttempt, PayoutDestination, PayoutRecord, Transaction, TransactionAudit


class PaymentAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAttempt
        fields = ["id", "reference", "authorization_url", "status", "failure_reason", "created_at", "completed_at"]


class PayoutRecordSerializer(serializers.ModelSerializer):
    destination_label = serializers.SerializerMethodField()

    class Meta:
        model = PayoutRecord
        fields = ["id", "amount", "currency", "reference", "status", "destination_label", "initiated_at", "completed_at", "failure_reason", "created_at"]

    def get_destination_label(self, obj):
        return f"{obj.destination.bank_name or obj.destination.bank_code} ••••{obj.destination.account_last4}"


class TransactionAuditSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True)

    class Meta:
        model = TransactionAudit
        fields = ["id", "source", "event", "from_state", "to_state", "reason", "metadata", "actor_email", "created_at"]


class TransactionSerializer(serializers.ModelSerializer):
    client = ProfileSerializer(read_only=True)
    professional = ProfileSerializer(read_only=True)
    booking_id = serializers.UUIDField(source="booking.id", read_only=True)
    booking_status = serializers.CharField(source="booking.status", read_only=True)
    scope_summary = serializers.CharField(source="booking.scope_summary", read_only=True)
    latest_attempt = serializers.SerializerMethodField()
    payout = serializers.SerializerMethodField()
    audit_events = TransactionAuditSerializer(many=True, read_only=True)
    freeze_seconds_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id", "booking_id", "booking_status", "scope_summary", "client", "professional",
            "amount", "currency", "commission_rate", "commission_amount", "provider_amount",
            "state", "gateway", "funding_reference", "receipt_number", "funded_at",
            "service_started_at", "delivered_at", "release_eligible_at", "client_confirmed_at",
            "released_at", "cancelled_at", "refunded_at", "refund_status", "refund_reason",
            "reconciliation_status", "reconciliation_note", "reconciled_at", "latest_attempt",
            "payout", "freeze_seconds_remaining", "audit_events", "created_at", "updated_at",
        ]

    def get_latest_attempt(self, obj):
        attempt = obj.payment_attempts.first()
        return PaymentAttemptSerializer(attempt).data if attempt else None

    def get_payout(self, obj):
        try:
            return PayoutRecordSerializer(obj.payout).data
        except PayoutRecord.DoesNotExist:
            return None

    def get_freeze_seconds_remaining(self, obj):
        if not obj.release_eligible_at or obj.state != Transaction.State.DELIVERED:
            return 0
        from django.utils import timezone
        return max(0, int((obj.release_eligible_at - timezone.now()).total_seconds()))


class InitializePaymentSerializer(serializers.Serializer):
    booking_id = serializers.UUIDField()
    return_url = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_booking_id(self, value):
        request = self.context["request"]
        try:
            booking = BookingRequest.objects.select_related("client__user", "professional__user").get(pk=value)
        except BookingRequest.DoesNotExist as exc:
            raise serializers.ValidationError("Booking not found.") from exc
        if booking.client.user_id != request.user.id:
            raise serializers.ValidationError("Only the booking client can fund this booking.")
        self.context["booking"] = booking
        return value


class VerifyPaymentSerializer(serializers.Serializer):
    reference = serializers.CharField(required=False, allow_blank=True, max_length=120)


class PayoutDestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutDestination
        fields = ["id", "gateway", "account_name", "bank_code", "bank_name", "account_last4", "is_active", "verified_at", "created_at", "updated_at"]


class PayoutDestinationCreateSerializer(serializers.Serializer):
    account_number = serializers.CharField(write_only=True, max_length=20)
    bank_code = serializers.CharField(max_length=32)
    bank_name = serializers.CharField(required=False, allow_blank=True, max_length=120)


class AdminRefundSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=4, max_length=500)
