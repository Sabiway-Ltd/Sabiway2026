import re
import uuid

import cloudinary.models
from django.conf import settings
from django.db import models

from profiles.models import Profile


def extract_hashtags(text: str):
    if not text:
        return []
    tags = re.findall(r"#([A-Za-z0-9_]+)", text)
    return list(dict.fromkeys(tag.lower() for tag in tags))


class Hashtag(models.Model):
    tag = models.CharField(max_length=128, unique=True)
    use_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"#{self.tag}"


class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField(blank=True)
    image = cloudinary.models.CloudinaryField("image", blank=True, null=True)
    hashtags = models.ManyToManyField("Hashtag", blank=True, related_name="posts")
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    impressions_count = models.PositiveIntegerField(default=0)
    reposts_count = models.PositiveIntegerField(default=0)
    is_hidden = models.BooleanField(default=False, db_index=True)
    moderation_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    original_post = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="reposted_by"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author.username} - {self.created_at.isoformat()[:19]}"

    def parse_and_attach_hashtags(self):
        for name in extract_hashtags(self.content):
            tag_obj, _ = Hashtag.objects.get_or_create(tag=name)
            if not self.hashtags.filter(pk=tag_obj.pk).exists():
                self.hashtags.add(tag_obj)
                tag_obj.use_count = models.F("use_count") + 1
                tag_obj.save(update_fields=["use_count"])

    def increment_repost_count(self):
        self.reposts_count = models.F("reposts_count") + 1
        self.save(update_fields=["reposts_count"])


class Like(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")
        indexes = [models.Index(fields=["post"]), models.Index(fields=["user"])]


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="comments")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    image = cloudinary.models.CloudinaryField("image", blank=True, null=True)
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="bookmarked_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")


class Reply(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="replies")
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="replies")
    content = models.TextField()
    image = cloudinary.models.CloudinaryField("image", blank=True, null=True)
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    parent_reply = models.ForeignKey(
        "self", null=True, blank=True, related_name="child_replies", on_delete=models.CASCADE
    )

    class Meta:
        ordering = ["created_at"]


class PostImpression(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, null=True, blank=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=100, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "post"], name="unique_user_post_impression", condition=models.Q(user__isnull=False)),
            models.UniqueConstraint(fields=["session_key", "post"], name="unique_session_post_impression", condition=models.Q(session_key__isnull=False)),
            models.UniqueConstraint(fields=["ip_address", "post"], name="unique_ip_post_impression", condition=models.Q(ip_address__isnull=False)),
        ]


class ReplyLike(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="reply_likes")
    reply = models.ForeignKey(Reply, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "reply")


class CommentLike(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="comment_likes")
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "comment")


class PostReport(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        DISMISSED = "dismissed", "Dismissed"
        REMOVED = "removed", "Removed"
        RESTORED = "restored", "Restored"

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="reports")
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.TextField()
    post_url = models.URLField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_post_reports",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    resolution_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report for Post {self.post.id} ({self.status})"


class ModerationAudit(models.Model):
    class Action(models.TextChoices):
        REPORTED = "reported", "Reported"
        DISMISSED = "dismissed", "Dismissed"
        REMOVED = "removed", "Removed"
        RESTORED = "restored", "Restored"

    report = models.ForeignKey(PostReport, on_delete=models.CASCADE, related_name="audit_events")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="moderation_audit_events")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
