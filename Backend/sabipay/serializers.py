from rest_framework import serializers

from marketplace.models import BookingRequest
from profiles.serializers import ProfileSerializer

from .models import (
    Dispute,
    DisputeEvidence,
    FxQuote,
    PaymentAttempt,
    PayoutDestination,
    PayoutRecord,
    Transaction,
    TransactionAudit,
)


class PaymentAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAttempt
        fields = ["id", "reference", "authorization_url", "status", "failure_reason", "created_at", "completed_at"]


class FxQuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FxQuote
        fields = ["id", "provider", "reference", "source_currency", "target_currency", "source_amount", "target_amount", "rate", "fee_amount", "quoted_at", "expires_at", "status"]
        read_only_fields = fields


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


class DisputeEvidenceSerializer(serializers.ModelSerializer):
    submitted_by = ProfileSerializer(read_only=True)

    class Meta:
        model = DisputeEvidence
        fields = ["id", "submitted_by", "note", "reference_url", "created_at"]
        read_only_fields = fields


class DisputeSerializer(serializers.ModelSerializer):
    opened_by_profile = ProfileSerializer(read_only=True)
    evidence = DisputeEvidenceSerializer(many=True, read_only=True)
    assigned_to_email = serializers.EmailField(source="assigned_to.email", read_only=True)
    resolved_by_email = serializers.EmailField(source="resolved_by.email", read_only=True)
    receipt_number = serializers.CharField(source="transaction.receipt_number", read_only=True)

    class Meta:
        model = Dispute
        fields = ["id", "transaction", "receipt_number", "opened_by_profile", "reason", "details", "transaction_state_at_open", "status", "outcome", "assigned_to_email", "reviewed_at", "resolution", "resolved_by_email", "resolved_at", "closed_at", "evidence", "created_at"]
        read_only_fields = fields


class TransactionSerializer(serializers.ModelSerializer):
    client = ProfileSerializer(read_only=True)
    professional = ProfileSerializer(read_only=True)
    booking_id = serializers.UUIDField(source="booking.id", read_only=True)
    booking_status = serializers.CharField(source="booking.status", read_only=True)
    scope_summary = serializers.CharField(source="booking.scope_summary", read_only=True)
    latest_attempt = serializers.SerializerMethodField()
    latest_fx_quote = serializers.SerializerMethodField()
    payout = serializers.SerializerMethodField()
    disputes = DisputeSerializer(many=True, read_only=True)
    audit_events = TransactionAuditSerializer(many=True, read_only=True)
    freeze_seconds_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id", "booking_id", "booking_status", "scope_summary", "client", "professional",
            "amount", "currency", "service_amount", "service_currency", "payer_amount", "payer_currency",
            "payout_amount", "payout_currency", "payment_market", "payout_market", "fx_rate", "fx_provider",
            "fx_quote_reference", "fx_quoted_at", "fx_expires_at", "fx_fee", "payment_processing_fee",
            "commission_rate", "commission_amount", "provider_amount", "state", "payment_status", "last_payment_error",
            "last_payment_checked_at", "gateway", "funding_reference", "receipt_number", "funded_at", "service_started_at",
            "delivered_at", "release_eligible_at", "client_confirmed_at", "released_at", "cancelled_at", "refunded_at",
            "refund_status", "refund_reason", "reconciliation_status", "reconciliation_note", "reconciled_at", "latest_attempt",
            "latest_fx_quote", "payout", "disputes", "freeze_seconds_remaining", "audit_events", "created_at", "updated_at",
        ]

    def get_latest_attempt(self, obj):
        attempt = obj.payment_attempts.first()
        return PaymentAttemptSerializer(attempt).data if attempt else None

    def get_latest_fx_quote(self, obj):
        quote = obj.fx_quotes.first()
        return FxQuoteSerializer(quote).data if quote else None

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
            booking = BookingRequest.objects.select_related("client__user", "professional__user", "listing", "job").get(pk=value)
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
        fields = ["id", "gateway", "country_code", "currency", "account_name", "bank_code", "bank_name", "account_last4", "is_active", "verified_at", "created_at", "updated_at"]


class PayoutDestinationCreateSerializer(serializers.Serializer):
    account_number = serializers.CharField(write_only=True, max_length=20)
    bank_code = serializers.CharField(max_length=32)
    bank_name = serializers.CharField(required=False, allow_blank=True, max_length=120)
    country_code = serializers.CharField(required=False, allow_blank=True, max_length=2)
    currency = serializers.CharField(required=False, allow_blank=True, max_length=3)


class AdminRefundSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=4, max_length=500)


class OpenDisputeSerializer(serializers.Serializer):
    transaction_id = serializers.UUIDField()
    reason = serializers.ChoiceField(choices=Dispute.Reason.choices)
    details = serializers.CharField(min_length=10, max_length=4000)


class DisputeEvidenceCreateSerializer(serializers.Serializer):
    note = serializers.CharField(min_length=3, max_length=4000)
    reference_url = serializers.URLField(required=False, allow_blank=True, max_length=500)


class DisputeResolutionSerializer(serializers.Serializer):
    outcome = serializers.ChoiceField(choices=[Dispute.Outcome.RESUME, Dispute.Outcome.REFUND, Dispute.Outcome.RELEASE, Dispute.Outcome.CLOSED_NO_ACTION])
    resolution = serializers.CharField(min_length=5, max_length=4000)
