import uuid

from django.conf import settings
from django.db import models

from marketplace.models import BookingRequest
from profiles.models import Profile
from sabipay.models import Dispute, Transaction


class DisputeCase(models.Model):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Decision(models.TextChoices):
        NONE = "", "Not decided"
        RELEASE_FULL = "release_full", "Release full payment"
        REFUND_FULL = "refund_full", "Refund full payment"
        PARTIAL = "partial", "Partial outcome"

    dispute = models.OneToOneField(Dispute, on_delete=models.CASCADE, related_name="case")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="assigned_dispute_cases", null=True, blank=True)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.NORMAL)
    response_due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    decision = models.CharField(max_length=24, choices=Decision.choices, blank=True)
    decision_reason = models.TextField(blank=True)
    provider_release_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    client_refund_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="resolved_dispute_cases", null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        permissions = [("manage_trust_cases", "Can triage and resolve trust cases")]
        indexes = [models.Index(fields=["priority", "response_due_at"], name="trust_dispute_sla_idx")]

    def __str__(self):
        return f"{self.dispute.transaction.receipt_number} — {self.dispute.status}"


class DisputeEvidence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name="evidence_items")
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="trust_evidence_uploads")
    filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    size = models.PositiveIntegerField()
    checksum_sha256 = models.CharField(max_length=64)
    encrypted_payload = models.BinaryField(editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.dispute_id} — {self.filename}"


class DisputeNote(models.Model):
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name="case_notes")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="dispute_case_notes")
    body = models.TextField()
    internal = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Review(models.Model):
    class ModerationStatus(models.TextChoices):
        PUBLISHED = "published", "Published"
        HIDDEN = "hidden", "Hidden pending review"
        REMOVED = "removed", "Removed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(BookingRequest, on_delete=models.PROTECT, related_name="review")
    transaction = models.OneToOneField(Transaction, on_delete=models.PROTECT, related_name="review")
    client = models.ForeignKey(Profile, on_delete=models.PROTECT, related_name="reviews_written")
    professional = models.ForeignKey(Profile, on_delete=models.PROTECT, related_name="reviews_received")
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=120, blank=True)
    body = models.TextField(blank=True)
    moderation_status = models.CharField(max_length=16, choices=ModerationStatus.choices, default=ModerationStatus.PUBLISHED)
    moderation_reason = models.TextField(blank=True)
    moderated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="moderated_reviews", null=True, blank=True)
    moderated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        permissions = [("moderate_reviews", "Can moderate marketplace reviews")]
        indexes = [
            models.Index(fields=["professional", "moderation_status", "created_at"], name="trust_review_prof_idx"),
            models.Index(fields=["rating", "created_at"], name="trust_review_rating_idx"),
        ]

    def __str__(self):
        return f"{self.professional.username} — {self.rating}/5"


class ReviewReport(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWED = "reviewed", "Reviewed"
        DISMISSED = "dismissed", "Dismissed"
        ACTIONED = "actioned", "Actioned"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="review_reports")
    reason = models.CharField(max_length=80)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="review_reports_handled", null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["review", "reporter"], name="trust_review_reporter_uniq")]


class SupportCase(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In progress"
        ESCALATED = "escalated", "Escalated"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    class Priority(models.TextChoices):
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    opened_by = models.ForeignKey(Profile, on_delete=models.PROTECT, related_name="support_cases")
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, related_name="support_cases", null=True, blank=True)
    dispute = models.ForeignKey(Dispute, on_delete=models.SET_NULL, related_name="support_cases", null=True, blank=True)
    review = models.ForeignKey(Review, on_delete=models.SET_NULL, related_name="support_cases", null=True, blank=True)
    category = models.CharField(max_length=80)
    summary = models.CharField(max_length=180)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.NORMAL)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="assigned_support_cases", null=True, blank=True)
    escalated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="escalated_support_cases", null=True, blank=True)
    escalated_at = models.DateTimeField(null=True, blank=True)
    response_due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        permissions = [("manage_support_cases", "Can manage support and escalation cases")]
        indexes = [models.Index(fields=["status", "priority", "response_due_at"], name="trust_support_queue_idx")]

    def __str__(self):
        return f"{self.summary} — {self.status}"


class SupportNote(models.Model):
    case = models.ForeignKey(SupportCase, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="support_notes")
    body = models.TextField()
    internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class SupportAudit(models.Model):
    case = models.ForeignKey(SupportCase, on_delete=models.CASCADE, related_name="audit_events")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="support_audit_events", null=True, blank=True)
    event = models.CharField(max_length=80)
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20, blank=True)
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class FraudSignal(models.Model):
    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWED = "reviewed", "Reviewed"
        DISMISSED = "dismissed", "Dismissed"
        ACTIONED = "actioned", "Actioned"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, related_name="fraud_signals", null=True, blank=True)
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, related_name="fraud_signals", null=True, blank=True)
    dispute = models.ForeignKey(Dispute, on_delete=models.SET_NULL, related_name="fraud_signals", null=True, blank=True)
    support_case = models.ForeignKey(SupportCase, on_delete=models.SET_NULL, related_name="fraud_signals", null=True, blank=True)
    code = models.CharField(max_length=80)
    severity = models.CharField(max_length=16, choices=Severity.choices, default=Severity.MEDIUM)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    context = models.JSONField(default=dict, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="fraud_signals_reviewed", null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        permissions = [("manage_fraud_signals", "Can review marketplace fraud signals")]
        indexes = [models.Index(fields=["status", "severity", "created_at"], name="trust_fraud_queue_idx")]

    def __str__(self):
        return f"{self.code} — {self.severity} — {self.status}"
