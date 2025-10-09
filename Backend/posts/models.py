# posts/models.py

from django.conf import settings
from django.db import models
from django.utils import timezone
import re
import uuid
import cloudinary.models


# Profile model path
from profiles.models import Profile


def extract_hashtags(text: str):
    if not text:
        return []
    # simple regex to get hashtags (letters, numbers, underscore)
    tags = re.findall(r"#([A-Za-z0-9_]+)", text)
    return list(dict.fromkeys([t.lower() for t in tags]))  # unique, lowercased preserving order


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
    hashtags = models.ManyToManyField(Hashtag, blank=True, related_name="posts")
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    impressions_count = models.PositiveIntegerField(default=0)
    reposts_count = models.PositiveIntegerField(default=0)   # 🔥 new field
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author.username} - {self.created_at.isoformat()[:19]}"

    def parse_and_attach_hashtags(self):
        tag_names = extract_hashtags(self.content)
        if not tag_names:
            return
        for name in tag_names:
            tag_obj, created = Hashtag.objects.get_or_create(tag=name)
            # attach if not already attached
            if not self.hashtags.filter(pk=tag_obj.pk).exists():
                self.hashtags.add(tag_obj)
                tag_obj.use_count = models.F("use_count") + 1
                tag_obj.save(update_fields=["use_count"])


class Like(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")
        indexes = [models.Index(fields=["post"]), models.Index(fields=["user"])]

    def __str__(self):
        return f"{self.user.username} likes {self.post.id}"


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="comments")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment {self.id} by {self.user.username}"


class Reply(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="replies")
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="replies")
    content = models.TextField()
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Reply {self.id} by {self.user.username}"


class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks")
    post = models.ForeignKey("posts.Post", on_delete=models.CASCADE, related_name="bookmarked_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")



class Repost(models.Model):
    user = models.ForeignKey("profiles.Profile", on_delete=models.CASCADE, related_name="reposts")
    post = models.ForeignKey("posts.Post", on_delete=models.CASCADE, related_name="reposts")
    message = models.TextField(blank=True, null=True)  # optional quote
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")  # prevent duplicate reposts


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
