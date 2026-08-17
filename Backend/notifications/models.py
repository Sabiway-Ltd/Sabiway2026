# notifications/models.py

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
        ("schedule", "Schedule"),
        ("verification", "Verification"),
        ("payment", "Payment"),
        ("dispute", "Dispute"),
        ("review", "Review"),
        ("support", "Support"),
    ]

    # Who receives the notification
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="notifications")

    # Who triggered the notification. System-originated events may not have an actor.
    actor = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="actor_notifications", null=True, blank=True)

    # Type of notification
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)

    # Optional description/message for display
    message = models.TextField(blank=True, null=True)

    # Generic target (Post, Comment, Reply, Booking, etc.)
    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    target_object_id = models.CharField(max_length=255, null=True, blank=True)
    target = GenericForeignKey("target_content_type", "target_object_id")

    # Status & timestamp
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        actor = self.actor or "SabiWay"
        return f"{actor} -> {self.user} ({self.type})"
