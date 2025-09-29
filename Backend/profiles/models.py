# profiles/models.py
from django.conf import settings
from django.db import models
from django.utils.text import slugify

User = settings.AUTH_USER_MODEL


def generate_initials(full_name: str) -> str:
    parts = [p for p in (full_name or "").split() if p]
    if not parts:
        return ""
    first = parts[0]
    last = parts[-1] if len(parts) > 1 else parts[0]
    return (first[0] + last[0]).upper()


def base_username_from_fullname(full_name: str) -> str:
    parts = [p for p in (full_name or "").split() if p]
    if not parts:
        base = "user"
    else:
        base = f"{parts[0].lower()}_{parts[-1].lower()}"
    return slugify(base)


from django.db import models
from accounts.models import User
from cloudinary.models import CloudinaryField


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=255)
    initials = models.CharField(max_length=5, blank=True)
    email = models.EmailField()  # copied from user; read-only in API
    username = models.CharField(max_length=64, unique=True)  # stored like @first_last or @first_last_1
    
    # Cloudinary field for profile pictures
    profile_picture = CloudinaryField("image", blank=True, null=True)

    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    posts_count = models.PositiveIntegerField(default=0)
    whatsapp_number = models.CharField(max_length=32, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.username} ({self.full_name})"



class Follow(models.Model):
    id = models.BigAutoField(primary_key=True)
    follower = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="following_rel")
    following = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="followers_rel")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "following")
        indexes = [
            models.Index(fields=["follower"]),
            models.Index(fields=["following"]),
        ]

    def __str__(self):
        return f"{self.follower.username} -> {self.following.username}"
    

    