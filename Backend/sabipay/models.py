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

    class PaymentStatus(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        PENDING = "pending", "Pending"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        ABANDONED = "abandoned", "Abandoned"
        MISMATCH = "mismatch", "Mismatch"

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

    # Legacy contract amount/currency retained for compatibility. These mirror service_amount/service_currency.
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="NGN")
    service_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    service_currency = models.CharField(max_length=3, blank=True)
    payer_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    payer_currency = models.CharField(max_length=3, blank=True)
    payout_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    payout_currency = models.CharField(max_length=3, blank=True)
    payment_market = models.CharField(max_length=2, blank=True, db_index=True)
    payout_market = models.CharField(max_length=2, blank=True, db_index=True)

    fx_rate = models.DecimalField(max_digits=24, decimal_places=10, null=True, blank=True)
    fx_provider = models.CharField(max_length=80, blank=True)
    fx_quote_reference = models.CharField(max_length=120, blank=True, db_index=True)
    fx_quoted_at = models.DateTimeField(null=True, blank=True)
    fx_expires_at = models.DateTimeField(null=True, blank=True)
    fx_fee = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    payment_processing_fee = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    commission_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.1000"))
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2)
    provider_amount = models.DecimalField(max_digits=12, decimal_places=2)
    state = models.CharField(max_length=24, choices=State.choices, default=State.PENDING_PAYMENT)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.NOT_STARTED)
    last_payment_error = models.TextField(blank=True)
    last_payment_checked_at = models.DateTimeField(null=True, blank=True)
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
            models.Index(fields=["payment_status", "updated_at"], name="sabipay_payment_state_idx"),
            models.Index(fields=["service_currency", "payer_currency", "payout_currency"], name="sabipay_currency_idx"),
        ]
        permissions = [("manage_sabipay", "Can manage SabiPay transactions and payouts")]

    def save(self, *args, **kwargs):
        self.currency = (self.currency or "").upper()
        self.service_currency = (self.service_currency or self.currency or "").upper()
        self.payer_currency = (self.payer_currency or self.service_currency or "").upper()
        self.payout_currency = (self.payout_currency or self.service_currency or "").upper()
        self.payment_market = (self.payment_market or "").upper()
        self.payout_market = (self.payout_market or "").upper()
        if self.service_amount is None:
            self.service_amount = self.amount
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.receipt_number} — {self.amount} {self.currency} — {self.state}"


class FxQuote(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        USED = "used", "Used"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name="fx_quotes", null=True, blank=True)
    provider = models.CharField(max_length=80)
    reference = models.CharField(max_length=120, unique=True)
    source_currency = models.CharField(max_length=3)
    target_currency = models.CharField(max_length=3)
    source_amount = models.DecimalField(max_digits=12, decimal_places=2)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    rate = models.DecimalField(max_digits=24, decimal_places=10)
    fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    quoted_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    raw_reference = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-quoted_at"]
        indexes = [models.Index(fields=["source_currency", "target_currency", "status"], name="sabipay_fx_pair_idx")]


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
    country_code = models.CharField(max_length=2, blank=True, db_index=True)
    currency = models.CharField(max_length=3, default="NGN")
    recipient_code = models.CharField(max_length=120, unique=True)
    account_name = models.CharField(max_length=180)
    bank_code = models.CharField(max_length=32)
    bank_name = models.CharField(max_length=120, blank=True)
    account_last4 = models.CharField(max_length=4)
    is_active = models.BooleanField(default=True)
    verified_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.country_code = (self.country_code or "").upper()
        self.currency = (self.currency or "").upper()
        super().save(*args, **kwargs)

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

    class Reason(models.TextChoices):
        SERVICE_NOT_PROVIDED = "service_not_provided", "Service not provided"
        SERVICE_NOT_AS_AGREED = "service_not_as_agreed", "Service not as agreed"
        PAYMENT_PROBLEM = "payment_problem", "Payment problem"
        SAFETY_CONCERN = "safety_concern", "Safety concern"
        DUPLICATE_CHARGE = "duplicate_charge", "Duplicate charge"
        OTHER = "other", "Other"

    class Outcome(models.TextChoices):
        NONE = "none", "No decision yet"
        RESUME = "resume", "Resume transaction"
        REFUND = "refund", "Refund client"
        RELEASE = "release", "Release provider payment"
        CLOSED_NO_ACTION = "closed_no_action", "Close with no financial action"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.PROTECT, related_name="disputes")
    opened_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sabipay_disputes_opened")
    opened_by_profile = models.ForeignKey(Profile, on_delete=models.PROTECT, related_name="sabipay_disputes_opened", null=True, blank=True)
    reason = models.CharField(max_length=80, choices=Reason.choices, default=Reason.OTHER)
    details = models.TextField()
    transaction_state_at_open = models.CharField(max_length=24, blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.OPEN)
    outcome = models.CharField(max_length=32, choices=Outcome.choices, default=Outcome.NONE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="sabipay_disputes_assigned", null=True, blank=True)
    resolution = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="sabipay_disputes_resolved", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["transaction", "status"], name="sabipay_dispute_state_idx")]

    def __str__(self):
        return f"{self.transaction.receipt_number} — {self.status}"


class DisputeEvidence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name="evidence")
    submitted_by = models.ForeignKey(Profile, on_delete=models.PROTECT, related_name="sabipay_dispute_evidence")
    note = models.TextField()
    reference_url = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Evidence {self.id} — {self.dispute_id}"


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
