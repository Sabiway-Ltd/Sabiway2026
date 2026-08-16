import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from profiles.models import Profile


class ServiceCategory(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=80, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ServiceSubcategory(models.Model):
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name="subcategories")
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        unique_together = (("category", "slug"),)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.category.name} / {self.name}"


class ServiceListing(models.Model):
    class DeliveryMode(models.TextChoices):
        IN_PERSON = "in_person", "In person"
        REMOTE = "remote", "Remote"
        BOTH = "both", "In person or remote"

    class ModerationStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING = "pending", "Pending review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        SUSPENDED = "suspended", "Suspended"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="service_listings")
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name="listings")
    subcategory = models.ForeignKey(ServiceSubcategory, on_delete=models.PROTECT, related_name="listings", null=True, blank=True)
    title = models.CharField(max_length=160)
    description = models.TextField()
    price_from = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="NGN")
    pricing_note = models.CharField(max_length=160, blank=True)
    delivery_mode = models.CharField(max_length=20, choices=DeliveryMode.choices, default=DeliveryMode.IN_PERSON)
    country = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=120, blank=True)
    area = models.CharField(max_length=120, blank=True)
    availability_text = models.CharField(max_length=160, blank=True)
    available_now = models.BooleanField(default=False)
    moderation_status = models.CharField(max_length=20, choices=ModerationStatus.choices, default=ModerationStatus.PENDING)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_featured", "-available_now", "-created_at"]
        indexes = [
            models.Index(fields=["category", "moderation_status", "is_active"], name="mkt_list_cat_mod_idx"),
            models.Index(fields=["country", "state", "city"], name="mkt_list_location_idx"),
            models.Index(fields=["provider", "is_active"], name="mkt_list_provider_idx"),
        ]

    def __str__(self):
        return f"{self.title} — {self.provider.username}"


class JobPosting(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        OPEN = "open", "Open"
        PAUSED = "paused", "Paused"
        CLOSED = "closed", "Closed"
        CANCELLED = "cancelled", "Cancelled"

    class ModerationStatus(models.TextChoices):
        PENDING = "pending", "Pending review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        SUSPENDED = "suspended", "Suspended"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="marketplace_jobs")
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name="jobs")
    subcategory = models.ForeignKey(ServiceSubcategory, on_delete=models.PROTECT, related_name="jobs", null=True, blank=True)
    title = models.CharField(max_length=180)
    description = models.TextField()
    budget_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="NGN")
    delivery_mode = models.CharField(max_length=20, choices=ServiceListing.DeliveryMode.choices, default=ServiceListing.DeliveryMode.IN_PERSON)
    country = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=120, blank=True)
    area = models.CharField(max_length=120, blank=True)
    needed_by = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    moderation_status = models.CharField(max_length=20, choices=ModerationStatus.choices, default=ModerationStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "moderation_status"], name="mkt_job_status_mod_idx"),
            models.Index(fields=["country", "state", "city"], name="mkt_job_location_idx"),
            models.Index(fields=["category", "status"], name="mkt_job_category_idx"),
        ]

    def __str__(self):
        return self.title


class JobResponse(models.Model):
    class Status(models.TextChoices):
        SENT = "sent", "Sent"
        SHORTLISTED = "shortlisted", "Shortlisted"
        DECLINED = "declined", "Declined"
        WITHDRAWN = "withdrawn", "Withdrawn"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name="responses")
    professional = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="job_responses")
    message = models.TextField()
    proposed_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="NGN")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SENT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = (("job", "professional"),)

    def __str__(self):
        return f"{self.professional.username} → {self.job.title}"


class BookingRequest(models.Model):
    """Legacy booking request kept for backward compatibility until Phase 5 replaces it."""

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
            models.Index(fields=["client", "status"], name="mkt_book_client_status_idx"),
            models.Index(fields=["listing", "status"], name="mkt_book_list_status_idx"),
        ]

    def __str__(self):
        return f"{self.client.username} → {self.listing.title} ({self.status})"
