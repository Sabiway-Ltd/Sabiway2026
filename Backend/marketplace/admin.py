from django.contrib import admin

from .models import (
    BookingAudit,
    BookingRequest,
    ConversationBlock,
    ConversationReport,
    JobPosting,
    JobResponse,
    MessageThread,
    ScheduleProposal,
    ServiceCategory,
    ServiceListing,
    ServiceSubcategory,
)


class ServiceSubcategoryInline(admin.TabularInline):
    model = ServiceSubcategory
    extra = 0


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "sort_order", "is_active")
    list_filter = ("is_active",)
    list_editable = ("sort_order", "is_active")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ServiceSubcategoryInline]


@admin.register(ServiceSubcategory)
class ServiceSubcategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active")
    list_filter = ("is_active", "category")
    search_fields = ("name", "category__name")


@admin.register(ServiceListing)
class ServiceListingAdmin(admin.ModelAdmin):
    list_display = ("title", "provider", "category", "city", "state", "price_from", "currency", "available_now", "moderation_status", "is_featured", "is_active")
    list_filter = ("moderation_status", "is_featured", "is_active", "available_now", "delivery_mode", "category", "country", "state")
    list_editable = ("moderation_status", "is_featured", "is_active")
    search_fields = ("title", "description", "provider__full_name", "provider__username", "city", "state")
    readonly_fields = ("id", "created_at", "updated_at")


class JobResponseInline(admin.TabularInline):
    model = JobResponse
    extra = 0
    readonly_fields = ("professional", "message", "proposed_price", "currency", "status", "created_at")


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ("title", "client", "category", "city", "state", "status", "moderation_status", "created_at")
    list_filter = ("status", "moderation_status", "delivery_mode", "category", "country", "state")
    list_editable = ("status", "moderation_status")
    search_fields = ("title", "description", "client__full_name", "client__username", "city", "state")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [JobResponseInline]


@admin.register(JobResponse)
class JobResponseAdmin(admin.ModelAdmin):
    list_display = ("job", "professional", "proposed_price", "currency", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("job__title", "professional__full_name")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    """Support metadata only: message bodies are deliberately not exposed in admin."""
    list_display = ("id", "client", "professional", "status", "listing", "job", "last_message_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("client__full_name", "professional__full_name", "listing__title", "job__title")
    readonly_fields = ("id", "client", "professional", "listing", "job", "job_response", "last_message_at", "created_at", "updated_at")


@admin.register(ConversationBlock)
class ConversationBlockAdmin(admin.ModelAdmin):
    list_display = ("blocker", "blocked", "thread", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ConversationReport)
class ConversationReportAdmin(admin.ModelAdmin):
    """Report metadata is reviewable without exposing private message content."""
    list_display = ("id", "reporter", "reported_user", "reason", "status", "thread", "message_id", "created_at")
    list_filter = ("reason", "status", "created_at")
    list_editable = ("status",)
    search_fields = ("reporter__full_name", "reported_user__full_name", "details")
    readonly_fields = ("id", "thread", "reporter", "reported_user", "message", "details", "created_at")


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "professional", "status", "schedule_status", "agreed_price", "currency", "requested_for", "created_at")
    list_filter = ("status", "schedule_status", "currency", "created_at")
    search_fields = ("client__full_name", "professional__full_name", "scope_summary", "job__title", "listing__title")
    readonly_fields = ("id", "created_at", "updated_at", "accepted_at")


@admin.register(ScheduleProposal)
class ScheduleProposalAdmin(admin.ModelAdmin):
    list_display = ("booking", "proposer", "proposed_for", "timezone", "status", "created_at")
    list_filter = ("status", "timezone", "created_at")
    readonly_fields = ("id", "booking", "proposer", "proposed_for", "timezone", "note", "status", "responded_at", "created_at")


@admin.register(BookingAudit)
class BookingAuditAdmin(admin.ModelAdmin):
    list_display = ("booking", "event", "actor", "from_status", "to_status", "created_at")
    list_filter = ("event", "created_at")
    readonly_fields = ("booking", "actor", "event", "from_status", "to_status", "metadata", "created_at")

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
