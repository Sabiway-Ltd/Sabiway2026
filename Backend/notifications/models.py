from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

from profiles.models import Profile


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("follow", "Follow"),
        ("like", "Like"),
        ("comment", "Comment"),
        ("reply", "Reply"),
        ("post", "Post"),
        ("message", "Message"),
        ("booking", "Booking"),
        ("verification", "Verification"),
        ("payment", "Payment"),
        ("dispute", "Dispute"),
        ("review", "Review"),
        ("support", "Support"),
    ]

    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        related_name="actor_notifications",
        null=True,
        blank=True,
    )
    type = models.CharField(max_length=24, choices=NOTIFICATION_TYPES)
    message = models.TextField(blank=True, null=True)
    deep_link = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    event_key = models.CharField(max_length=180, unique=True, null=True, blank=True)

    target_content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    target_object_id = models.CharField(max_length=255, null=True, blank=True)
    target = GenericForeignKey("target_content_type", "target_object_id")

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "created_at"], name="notif_user_read_time_idx"),
            models.Index(fields=["type", "created_at"], name="notif_type_time_idx"),
        ]

    def __str__(self):
        actor = self.actor.username if self.actor else "SabiWay"
        return f"{actor} -> {self.user} ({self.type})"


class NotificationPreference(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="notification_preferences")
    push_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)
    payment_email_enabled = models.BooleanField(default=True)
    dispute_email_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.profile.username} notification preferences"


class PushDevice(models.Model):
    class Platform(models.TextChoices):
        IOS = "ios", "iOS"
        ANDROID = "android", "Android"
        WEB = "web", "Web"

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="push_devices")
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=16, choices=Platform.choices)
    device_name = models.CharField(max_length=120, blank=True)
    is_active = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-last_seen_at"]
        indexes = [models.Index(fields=["profile", "is_active"], name="notif_device_active_idx")]

    def __str__(self):
        return f"{self.profile.username} — {self.platform}"


class NotificationDelivery(models.Model):
    class Channel(models.TextChoices):
        IN_APP = "in_app", "In app"
        PUSH = "push", "Push"
        EMAIL = "email", "Email"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        SKIPPED = "skipped", "Skipped"
        FAILED = "failed", "Failed"

    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name="deliveries")
    channel = models.CharField(max_length=16, choices=Channel.choices)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    provider_reference = models.CharField(max_length=180, blank=True)
    error = models.TextField(blank=True)
    attempted_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(fields=["notification", "channel"], name="notif_delivery_channel_uniq")
        ]

    def __str__(self):
        return f"{self.notification_id} — {self.channel} — {self.status}"
