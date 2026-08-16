import uuid

from django.db import models
from django.utils.text import slugify

from profiles.models import Profile


class ServiceCategory(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ServiceListing(models.Model):
    class DeliveryMode(models.TextChoices):
        IN_PERSON = "in_person", "In person"
        REMOTE = "remote", "Remote"
        BOTH = "both", "In person or remote"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="service_listings")
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name="listings")
    title = models.CharField(max_length=160)
    description = models.TextField()
    price_from = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="NGN")
    delivery_mode = models.CharField(max_length=20, choices=DeliveryMode.choices, default=DeliveryMode.IN_PERSON)
    state = models.CharField(max_length=100, blank=True)
    area = models.CharField(max_length=120, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["category", "is_active"], name="marketplace__categor_84f1e5_idx"),
            models.Index(fields=["state", "area"], name="marketplace__state_93f56d_idx"),
            models.Index(fields=["provider", "is_active"], name="marketplace__provide_aa16fe_idx"),
        ]

    def __str__(self):
        return f"{self.title} — {self.provider.username}"


class BookingRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(ServiceListing, on_delete=models.PROTECT, related_name="booking_requests")
    client = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="booking_requests")
    requested_for = models.DateTimeField(null=True, blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["client", "status"], name="marketplace__client__f67f23_idx"),
            models.Index(fields=["listing", "status"], name="marketplace__listing_3e41bd_idx"),
        ]

    def __str__(self):
        return f"{self.client.username} → {self.listing.title} ({self.status})"
