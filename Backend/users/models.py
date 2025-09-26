# users/models.py

from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random, string

# Option A: extend AbstractUser to allow email as unique identifier
class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)  # we'll set format @first_last or similar
    email = models.EmailField(unique=True)
    # keep default fields like password
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # if you prefer

    def __str__(self):
        return self.email

def generate_initials(full_name: str) -> str:
    parts = [p for p in full_name.split() if p]
    if len(parts) == 0:
        return ""
    first = parts[0][0] if parts else ""
    last = parts[-1][0] if len(parts) > 1 else parts[0][1] if len(parts[0])>1 else ""
    return (first + last).upper()

def generate_username_from_fullname(full_name: str):
    parts = [p.lower() for p in full_name.split() if p]
    if not parts:
        base = f"user{random.randint(1000,9999)}"
    else:
        first = parts[0]
        last = parts[-1]
        base = f"{first}_{last}"
    return f"@{base}"

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255)
    initials = models.CharField(max_length=4, blank=True)
    # username stored w/out @ for DB operations, but you requested '@' format; we'll keep @ in stored username
    username = models.CharField(max_length=160, unique=True)
    profile_picture = models.URLField(blank=True, null=True)  # or ImageField with storage configured
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    posts_count = models.PositiveIntegerField(default=0)
    whatsapp_number = models.CharField(max_length=32, blank=True, null=True)

    def save(self, *args, **kwargs):
        # ensure initials auto generated if empty
        if self.full_name and not self.initials:
            self.initials = generate_initials(self.full_name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.full_name})"

class Follow(models.Model):
    follower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='following_rel')
    following = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='followers_rel')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')


# notifications and password reset
class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    verb = models.CharField(max_length=255)  # e.g. "posted", "liked", "followed"
    target_post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

class PasswordResetCode(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='password_reset_codes')
    code = models.CharField(max_length=6)  # we'll use 4 digits, but allow 6 for safety
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    def is_expired(self):
        return (timezone.now() - self.created_at).total_seconds() > 15*60  # 15 minutes expiry
