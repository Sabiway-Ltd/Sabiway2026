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


class MessageThread(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="client_message_threads")
    professional = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="professional_message_threads")
    listing = models.ForeignKey(ServiceListing, on_delete=models.SET_NULL, related_name="message_threads", null=True, blank=True)
    job = models.ForeignKey(JobPosting, on_delete=models.SET_NULL, related_name="message_threads", null=True, blank=True)
    job_response = models.ForeignKey(JobResponse, on_delete=models.SET_NULL, related_name="message_threads", null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_message_at", "-created_at"]
        indexes = [
            models.Index(fields=["client", "status"], name="mkt_thread_client_idx"),
            models.Index(fields=["professional", "status"], name="mkt_thread_prof_idx"),
        ]

    def __str__(self):
        return f"{self.client.username} ↔ {self.professional.username}"

    def participant_ids(self):
        return {self.client_id, self.professional_id}


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="marketplace_messages")
    body = models.TextField(blank=True)
    attachment = models.FileField(upload_to="marketplace/messages/%Y/%m/", null=True, blank=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    attachment_content_type = models.CharField(max_length=100, blank=True)
    attachment_size = models.PositiveIntegerField(default=0)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["thread", "created_at"], name="mkt_msg_thread_time_idx"),
            models.Index(fields=["thread", "is_read"], name="mkt_msg_read_idx"),
        ]

    def __str__(self):
        return f"Message {self.id} in {self.thread_id}"


class ConversationBlock(models.Model):
    blocker = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="marketplace_blocks_created")
    blocked = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="marketplace_blocks_received")
    thread = models.ForeignKey(MessageThread, on_delete=models.SET_NULL, related_name="blocks", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("blocker", "blocked"),)

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"


class ConversationReport(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWED = "reviewed", "Reviewed"
        DISMISSED = "dismissed", "Dismissed"
        ACTIONED = "actioned", "Actioned"

    class Reason(models.TextChoices):
        HARASSMENT = "harassment", "Harassment"
        SPAM = "spam", "Spam"
        FRAUD = "fraud", "Fraud or scam"
        CONTACT_POLICY = "contact_policy", "Contact detail policy"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="conversation_reports")
    reported_user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="conversation_reports_received")
    message = models.ForeignKey(Message, on_delete=models.SET_NULL, related_name="reports", null=True, blank=True)
    reason = models.CharField(max_length=30, choices=Reason.choices)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="reviewed_conversation_reports", null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report {self.id} — {self.reason}"


class BookingRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending professional acceptance"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CANCELLED = "cancelled", "Cancelled"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"

    class ScheduleStatus(models.TextChoices):
        NOT_SET = "not_set", "Not set"
        PROPOSED = "proposed", "Proposed"
        ACCEPTED = "accepted", "Accepted"
        CHANGE_REQUESTED = "change_requested", "Change requested"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(ServiceListing, on_delete=models.PROTECT, related_name="booking_requests", null=True, blank=True)
    client = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="booking_requests")
    professional = models.ForeignKey(Profile, on_delete=models.PROTECT, related_name="professional_bookings", null=True, blank=True)
    thread = models.OneToOneField(MessageThread, on_delete=models.PROTECT, related_name="booking", null=True, blank=True)
    job = models.ForeignKey(JobPosting, on_delete=models.SET_NULL, related_name="bookings", null=True, blank=True)
    job_response = models.ForeignKey(JobResponse, on_delete=models.SET_NULL, related_name="bookings", null=True, blank=True)
    scope_summary = models.TextField(blank=True)
    agreed_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="NGN")
    requested_for = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=64, default="UTC")
    schedule_status = models.CharField(max_length=24, choices=ScheduleStatus.choices, default=ScheduleStatus.NOT_SET)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["client", "status"], name="mkt_book_client_status_idx"),
            models.Index(fields=["listing", "status"], name="mkt_book_list_status_idx"),
            models.Index(fields=["professional", "status"], name="mkt_book_prof_status_idx"),
        ]

    def __str__(self):
        provider = self.professional or (self.listing.provider if self.listing_id else None)
        return f"{self.client.username} → {getattr(provider, 'username', 'professional')} ({self.status})"


class ScheduleProposal(models.Model):
    class Status(models.TextChoices):
        PROPOSED = "proposed", "Proposed"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        SUPERSEDED = "superseded", "Superseded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(BookingRequest, on_delete=models.CASCADE, related_name="schedule_proposals")
    proposer = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="schedule_proposals")
    proposed_for = models.DateTimeField()
    timezone = models.CharField(max_length=64, default="UTC")
    note = models.CharField(max_length=240, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PROPOSED)
    responded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.booking_id} — {self.proposed_for} ({self.status})"


class BookingAudit(models.Model):
    booking = models.ForeignKey(BookingRequest, on_delete=models.CASCADE, related_name="audit_events")
    actor = models.ForeignKey(Profile, on_delete=models.SET_NULL, related_name="booking_audit_events", null=True, blank=True)
    event = models.CharField(max_length=80)
    from_status = models.CharField(max_length=24, blank=True)
    to_status = models.CharField(max_length=24, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.booking_id} — {self.event}"
