import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models

from marketplace.models import BookingRequest
from profiles.models import Profile


class Transaction(models.Model):
    class State(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Pending payment"
        FUNDED = "funded", "Funded"
        IN_PROGRESS = "in_progress", "In progress"
        DELIVERED = "delivered", "Delivered"
        RELEASED = "released", "Released"
        DISPUTED = "disputed", "Disputed"
        REFUNDED = "refunded", "Refunded"
        CANCELLED = "cancelled", "Cancelled"

    class ReconciliationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        MATCHED = "matched", "Matched"
        MISMATCH = "mismatch", "Mismatch"

    class RefundStatus(models.TextChoices):
        NONE = "none", "None"
        PENDING = "pending", "Pending"
        PROCESSED = "processed", "Processed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(BookingRequest, on_delete=models.PROTECT, related_name="sabipay_transaction")
    client = models.ForeignKey(Profile, on_delete=models.PROTECT, related_name="sabipay_client_transactions")
    professional = models.ForeignKey(Profile, on_delete=models.PROTECT, related_name="sabipay_provider_transactions")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="NGN")
    commission_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.1000"))
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2)
    provider_amount = models.DecimalField(max_digits=12, decimal_places=2)
    state = models.CharField(max_length=24, choices=State.choices, default=State.PENDING_PAYMENT)
    gateway = models.CharField(max_length=24, default="paystack")
    funding_reference = models.CharField(max_length=120, blank=True, db_index=True)
    gateway_transaction_id = models.CharField(max_length=80, blank=True)
    receipt_number = models.CharField(max_length=64, unique=True)
    funded_at = models.DateTimeField(null=True, blank=True)
    service_started_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    release_eligible_at = models.DateTimeField(null=True, blank=True, db_index=True)
    client_confirmed_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    refund_status = models.CharField(max_length=16, choices=RefundStatus.choices, default=RefundStatus.NONE)
    refund_gateway_id = models.CharField(max_length=80, blank=True, db_index=True)
    refund_reason = models.TextField(blank=True)
    reconciliation_status = models.CharField(max_length=16, choices=ReconciliationStatus.choices, default=ReconciliationStatus.PENDING)
    reconciliation_note = models.TextField(blank=True)
    reconciled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["state", "release_eligible_at"], name="sabipay_release_due_idx"),
            models.Index(fields=["client", "state"], name="sabipay_client_state_idx"),
            models.Index(fields=["professional", "state"], name="sabipay_prof_state_idx"),
        ]
        permissions = [("manage_sabipay", "Can manage SabiPay transactions and payouts")]

    def __str__(self):
        return f"{self.receipt_number} — {self.amount} {self.currency} — {self.state}"


class PaymentAttempt(models.Model):
    class Status(models.TextChoices):
        INITIALIZED = "initialized", "Initialized"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        ABANDONED = "abandoned", "Abandoned"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name="payment_attempts")
    reference = models.CharField(max_length=120, unique=True)
    idempotency_key = models.CharField(max_length=120, unique=True, null=True, blank=True)
    authorization_url = models.URLField(max_length=500, blank=True)
    access_code = models.CharField(max_length=120, blank=True)
    gateway_transaction_id = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.INITIALIZED)
    failure_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["transaction", "status"], name="sabipay_attempt_status_idx")]

    def __str__(self):
        return self.reference


class PayoutDestination(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    professional = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="sabipay_payout_destination")
    gateway = models.CharField(max_length=24, default="paystack")
    recipient_code = models.CharField(max_length=120, unique=True)
    account_name = models.CharField(max_length=180)
    bank_code = models.CharField(max_length=32)
    bank_name = models.CharField(max_length=120, blank=True)
    account_last4 = models.CharField(max_length=4)
    is_active = models.BooleanField(default=True)
    verified_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.professional.username} — {self.bank_name or self.bank_code} ••••{self.account_last4}"


class PayoutRecord(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REVERSED = "reversed", "Reversed"
        MANUAL_REVIEW = "manual_review", "Manual review"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField(Transaction, on_delete=models.PROTECT, related_name="payout")
    destination = models.ForeignKey(PayoutDestination, on_delete=models.PROTECT, related_name="payouts")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="NGN")
    reference = models.CharField(max_length=120, unique=True)
    transfer_code = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PENDING)
    initiated_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} — {self.status}"


class Dispute(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        UNDER_REVIEW = "under_review", "Under review"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.PROTECT, related_name="disputes")
    opened_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sabipay_disputes_opened")
    reason = models.CharField(max_length=80)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.OPEN)
    resolution = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["transaction", "status"], name="sabipay_dispute_state_idx")]

    def __str__(self):
        return f"{self.transaction.receipt_number} — {self.status}"


class TransactionAudit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.PROTECT, related_name="audit_events")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="sabipay_audit_events", null=True, blank=True)
    source = models.CharField(max_length=24)
    event = models.CharField(max_length=80)
    from_state = models.CharField(max_length=24, blank=True)
    to_state = models.CharField(max_length=24, blank=True)
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    event_key = models.CharField(max_length=160, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["transaction", "created_at"], name="sabipay_audit_time_idx")]

    def __str__(self):
        return f"{self.transaction.receipt_number} — {self.event}"


class GatewayWebhookEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    digest = models.CharField(max_length=64, unique=True)
    event_name = models.CharField(max_length=80)
    reference = models.CharField(max_length=120, blank=True)
    processed = models.BooleanField(default=False)
    processing_note = models.TextField(blank=True)
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-received_at"]

    def __str__(self):
        return f"{self.event_name} — {self.reference or self.digest[:12]}"
