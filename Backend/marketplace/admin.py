from django.contrib import admin, messages
from django.utils import timezone

from operations.services import record_operations_audit
from verification.services import is_professional_verified

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
    list_display = ("title", "provider", "provider_verified", "category", "city", "state", "price_from", "currency", "available_now", "moderation_status", "is_featured", "is_active")
    list_filter = ("moderation_status", "is_featured", "is_active", "available_now", "delivery_mode", "category", "country", "state")
    list_editable = ("is_featured", "is_active")
    search_fields = ("title", "description", "provider__full_name", "provider__username", "city", "state")
    readonly_fields = ("id", "created_at", "updated_at")

    @admin.display(boolean=True, description="Verified")
    def provider_verified(self, obj):
        return is_professional_verified(obj.provider)

    def save_model(self, request, obj, form, change):
        if obj.moderation_status == ServiceListing.ModerationStatus.APPROVED and not is_professional_verified(obj.provider):
            obj.moderation_status = ServiceListing.ModerationStatus.PENDING
            obj.is_featured = False
            self.message_user(request, "Provider verification must be approved before this listing can go live.", level=messages.ERROR)
        super().save_model(request, obj, form, change)


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
    list_display = ("id", "reporter", "reported_user", "reason", "status", "reviewed_by", "thread", "message_id", "created_at")
    list_filter = ("reason", "status", "created_at")
    search_fields = ("reporter__full_name", "reported_user__full_name", "details")
    readonly_fields = ("id", "thread", "reporter", "reported_user", "message", "details", "created_at", "reviewed_by", "reviewed_at")

    def has_change_permission(self, request, obj=None):
        return bool(request.user.is_superuser or request.user.has_perm("marketplace.change_conversationreport"))

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        previous_status = ""
        if change and obj.pk:
            previous_status = ConversationReport.objects.get(pk=obj.pk).status
        if change and previous_status != obj.status:
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)
        if change and previous_status != obj.status:
            record_operations_audit(
                actor=request.user,
                action="conversation_report_status_changed",
                target_type="conversation_report",
                target_id=obj.pk,
                previous_state={"status": previous_status},
                new_state={"status": obj.status},
                metadata={"thread_id": str(obj.thread_id), "reported_user_id": obj.reported_user_id, "source": "django_admin"},
            )


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
