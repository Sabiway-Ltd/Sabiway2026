# profiles/models.py

from django.conf import settings
from django.db import models
from django.utils.text import slugify
from cloudinary.models import CloudinaryField

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
    base = "user" if not parts else f"{parts[0].lower()}_{parts[-1].lower()}"
    return slugify(base)


ROLE_CHOICES = [("professional", "Professional"), ("client", "Client")]


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name="profile")
    full_name = models.CharField(max_length=255)
    initials = models.CharField(max_length=5, blank=True)
    username = models.CharField(max_length=64, unique=True)
    profile_picture = CloudinaryField("image", blank=True, null=True)

    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    posts_count = models.PositiveIntegerField(default=0)

    phone_number = models.CharField(max_length=32, blank=True)
    gender = models.CharField(max_length=20, blank=True, choices=[("male", "Male"), ("female", "Female"), ("other", "Other")])
    date_of_birth = models.DateField(blank=True, null=True)

    # Human-readable base/account location. Existing fields remain for backwards compatibility.
    country = models.CharField(max_length=100, blank=True)
    country_code = models.CharField(max_length=2, blank=True, db_index=True)
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=120, blank=True)
    area = models.CharField(max_length=255, blank=True)
    postcode = models.CharField(max_length=32, blank=True)
    street = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=255, blank=True, editable=False)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Discovery preference is independent from account/base location.
    preferred_country_code = models.CharField(max_length=2, blank=True, db_index=True)
    preferred_state = models.CharField(max_length=100, blank=True)
    preferred_city = models.CharField(max_length=120, blank=True)
    preferred_area = models.CharField(max_length=255, blank=True)
    preferred_postcode = models.CharField(max_length=32, blank=True)
    preferred_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    preferred_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, blank=True, null=True, default=None)
    job = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def generate_address(self):
        parts = [self.street, self.area, self.city, self.state, self.country]
        return ", ".join([p for p in parts if p])

    def save(self, *args, **kwargs):
        self.initials = generate_initials(self.full_name)
        self.country_code = (self.country_code or "").strip().upper()
        self.preferred_country_code = (self.preferred_country_code or "").strip().upper()
        self.address = self.generate_address()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["country_code", "state", "city"], name="profile_location_idx"),
            models.Index(fields=["preferred_country_code", "preferred_city"], name="profile_pref_loc_idx"),
        ]

    def __str__(self):
        return f"{self.username} ({self.full_name})"


class Follow(models.Model):
    follower = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="following_rel")
    following = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="followers_rel")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "following")
        indexes = [models.Index(fields=["follower"]), models.Index(fields=["following"])]

    def __str__(self):
        return f"{self.follower.username} -> {self.following.username}"
