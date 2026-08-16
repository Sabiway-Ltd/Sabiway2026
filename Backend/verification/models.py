import uuid

from django.conf import settings
from django.db import models

from profiles.models import Profile


class VerificationSubmission(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        IN_REVIEW = "in_review", "In review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        MORE_INFO = "more_info", "More information needed"

    class IdentityType(models.TextChoices):
        PASSPORT = "passport", "Passport"
        NATIONAL_ID = "national_id", "National ID"
        DRIVERS_LICENCE = "drivers_licence", "Driver's licence"
        OTHER = "other", "Other government-issued ID"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    professional = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="verification_submission")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.SUBMITTED)
    identity_type = models.CharField(max_length=32, choices=IdentityType.choices)
    credential_summary = models.TextField(blank=True)
    address_line = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120, blank=True)
    state = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True)
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="verification_reviews", null=True, blank=True)
    version = models.PositiveIntegerField(default=1)
    submitted_at = models.DateTimeField(null=True, blank=True)
    review_started_at = models.DateTimeField(null=True, blank=True)
    decision_at = models.DateTimeField(null=True, blank=True)
    sla_due_at = models.DateTimeField(null=True, blank=True)
    decision_reason = models.TextField(blank=True)
    more_info_request = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-submitted_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "sla_due_at"], name="verify_status_sla_idx"),
            models.Index(fields=["professional", "status"], name="verify_prof_status_idx"),
        ]
        permissions = [("review_verification", "Can review provider verification submissions")]

    def __str__(self):
        return f"{self.professional.username} — {self.status}"


class VerificationDocument(models.Model):
    class Kind(models.TextChoices):
        IDENTITY = "identity", "Government ID"
        CREDENTIAL = "credential", "Skill or experience evidence"
        ADDRESS = "address", "Address evidence"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(VerificationSubmission, on_delete=models.CASCADE, related_name="documents")
    submission_version = models.PositiveIntegerField(default=1)
    kind = models.CharField(max_length=24, choices=Kind.choices)
    filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    size = models.PositiveIntegerField()
    checksum_sha256 = models.CharField(max_length=64)
    encrypted_payload = models.BinaryField(editable=False)
    retention_until = models.DateTimeField(null=True, blank=True)
    purged_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["kind", "-created_at"]
        indexes = [models.Index(fields=["retention_until", "purged_at"], name="verify_retention_idx")]

    def __str__(self):
        return f"{self.submission.professional.username} — {self.kind} — v{self.submission_version}"


class VerificationAudit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(VerificationSubmission, on_delete=models.CASCADE, related_name="audit_events")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="verification_audit_events", null=True, blank=True)
    event = models.CharField(max_length=60)
    from_status = models.CharField(max_length=24, blank=True)
    to_status = models.CharField(max_length=24, blank=True)
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["submission", "created_at"], name="verify_audit_time_idx")]

    def __str__(self):
        return f"{self.submission_id} — {self.event}"
