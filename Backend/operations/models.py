import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class SupportCase(models.Model):
    class Category(models.TextChoices):
        ACCOUNT = "account", "Account"
        SAFETY = "safety", "Safety"
        MARKETPLACE = "marketplace", "Marketplace"
        PAYMENT = "payment", "Payment"
        VERIFICATION = "verification", "Verification"
        CONTENT = "content", "Content"
        TECHNICAL = "technical", "Technical"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In progress"
        WAITING_USER = "waiting_user", "Waiting for user"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    opened_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="support_cases",
    )
    category = models.CharField(max_length=24, choices=Category.choices, default=Category.OTHER)
    subject = models.CharField(max_length=180)
    description = models.TextField()
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.OPEN, db_index=True)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.NORMAL, db_index=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_support_cases",
        limit_choices_to={"is_staff": True},
    )
    reference_type = models.CharField(max_length=40, blank=True)
    reference_id = models.CharField(max_length=120, blank=True)
    internal_note = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "priority", "created_at"], name="ops_support_queue_idx"),
            models.Index(fields=["opened_by", "created_at"], name="ops_support_user_idx"),
        ]
        permissions = [("manage_support", "Can manage support cases")]

    def __str__(self):
        return f"{self.subject} — {self.status}"


class PlatformConfiguration(models.Model):
    key = models.CharField(max_length=120, unique=True)
    value = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="platform_configuration_updates",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]
        permissions = [("manage_platform_config", "Can manage non-secret platform configuration")]

    def clean(self):
        lowered = self.key.lower()
        forbidden = ("secret", "password", "token", "api_key", "private_key")
        if any(part in lowered for part in forbidden):
            raise ValidationError({"key": "Secrets and credentials must remain in environment/secret management, not platform configuration."})

    def __str__(self):
        return self.key


class OperationsAudit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="operations_audit_events",
    )
    action = models.CharField(max_length=100, db_index=True)
    target_type = models.CharField(max_length=80, db_index=True)
    target_id = models.CharField(max_length=120, blank=True)
    previous_state = models.JSONField(default=dict, blank=True)
    new_state = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["target_type", "target_id", "created_at"], name="ops_audit_target_idx")]
        permissions = [
            ("view_operations_dashboard", "Can view the SabiWay operations dashboard"),
            ("manage_operational_roles", "Can manage operational role assignments"),
        ]

    def __str__(self):
        return f"{self.action} — {self.target_type}:{self.target_id}"
