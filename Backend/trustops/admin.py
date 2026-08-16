from django.contrib import admin, messages
from django.urls import reverse
from django.utils.html import format_html

from .models import DisputeCase, DisputeEvidence, DisputeNote, FraudSignal, Review, ReviewReport, SupportAudit, SupportCase, SupportNote
from .services import escalate_support_case, moderate_review, resolve_dispute, start_dispute_review


class DisputeEvidenceInline(admin.TabularInline):
    model = DisputeEvidence
    extra = 0
    can_delete = False
    fields = ("filename", "content_type", "size", "uploader", "created_at", "secure_download")
    readonly_fields = fields

    def secure_download(self, obj):
        if not obj.pk:
            return "Unavailable"
        url = reverse("trust-evidence-download", kwargs={"pk": obj.pk})
        return format_html('<a href="{}" target="_blank" rel="noopener">Secure download</a>', url)


class DisputeNoteInline(admin.TabularInline):
    model = DisputeNote
    extra = 0
    can_delete = False
    fields = ("author", "body", "internal", "created_at")
    readonly_fields = fields


@admin.register(DisputeCase)
class DisputeCaseAdmin(admin.ModelAdmin):
    list_display = ("receipt", "status", "priority", "assigned_to", "response_due_at", "decision", "resolved_at")
    list_filter = ("dispute__status", "priority", "decision", "created_at")
    search_fields = ("dispute__transaction__receipt_number", "dispute__opened_by__email", "dispute__reason", "dispute__details")
    readonly_fields = ("dispute", "response_due_at", "decision", "decision_reason", "provider_release_amount", "client_refund_amount", "resolved_by", "resolved_at", "created_at", "updated_at")
    inlines = [DisputeEvidenceInline, DisputeNoteInline]
    actions = ["start_review_selected", "release_full_selected", "refund_full_selected"]

    def receipt(self, obj): return obj.dispute.transaction.receipt_number
    def status(self, obj): return obj.dispute.status
    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False
    def has_change_permission(self, request, obj=None):
        return bool(request.user.is_superuser or request.user.has_perm("trustops.manage_trust_cases"))

    @admin.action(description="Start review for selected disputes")
    def start_review_selected(self, request, queryset):
        count = 0
        for case in queryset:
            try:
                start_dispute_review(case, request.user)
                count += 1
            except Exception as exc:
                self.message_user(request, f"{case}: {exc}", level=messages.ERROR)
        if count:
            self.message_user(request, f"Started review on {count} dispute(s).", level=messages.SUCCESS)

    @admin.action(description="Resolve selected disputes with full provider release")
    def release_full_selected(self, request, queryset):
        for case in queryset:
            try:
                resolve_dispute(case, actor=request.user, decision=DisputeCase.Decision.RELEASE_FULL, reason="Authorised full release from trust operations admin.")
            except Exception as exc:
                self.message_user(request, f"{case}: {exc}", level=messages.ERROR)

    @admin.action(description="Resolve selected disputes with full client refund")
    def refund_full_selected(self, request, queryset):
        for case in queryset:
            try:
                resolve_dispute(case, actor=request.user, decision=DisputeCase.Decision.REFUND_FULL, reason="Authorised full refund from trust operations admin.")
            except Exception as exc:
                self.message_user(request, f"{case}: {exc}", level=messages.ERROR)


class ReviewReportInline(admin.TabularInline):
    model = ReviewReport
    extra = 0
    can_delete = False
    readonly_fields = ("reporter", "reason", "details", "status", "reviewed_by", "reviewed_at", "created_at")
    fields = readonly_fields


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("professional", "client", "rating", "moderation_status", "created_at")
    list_filter = ("moderation_status", "rating", "created_at")
    search_fields = ("professional__full_name", "client__full_name", "title", "body", "transaction__receipt_number")
    readonly_fields = ("booking", "transaction", "client", "professional", "rating", "title", "body", "created_at", "updated_at")
    inlines = [ReviewReportInline]
    actions = ["publish_selected", "hide_selected", "remove_selected"]
    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False

    def _moderate(self, request, queryset, action):
        for review in queryset:
            moderate_review(review=review, actor=request.user, action=action, reason=f"{action.title()} from trust moderation admin.")
    @admin.action(description="Publish selected reviews")
    def publish_selected(self, request, queryset): self._moderate(request, queryset, "publish")
    @admin.action(description="Hide selected reviews")
    def hide_selected(self, request, queryset): self._moderate(request, queryset, "hide")
    @admin.action(description="Remove selected reviews")
    def remove_selected(self, request, queryset): self._moderate(request, queryset, "remove")


class SupportNoteInline(admin.TabularInline):
    model = SupportNote
    extra = 0
    fields = ("author", "body", "internal", "created_at")
    readonly_fields = fields
    can_delete = False


class SupportAuditInline(admin.TabularInline):
    model = SupportAudit
    extra = 0
    fields = ("actor", "event", "from_status", "to_status", "reason", "created_at")
    readonly_fields = fields
    can_delete = False


@admin.register(SupportCase)
class SupportCaseAdmin(admin.ModelAdmin):
    list_display = ("summary", "opened_by", "status", "priority", "assigned_to", "response_due_at", "created_at")
    list_filter = ("status", "priority", "category", "created_at")
    search_fields = ("summary", "details", "opened_by__full_name", "opened_by__username")
    readonly_fields = ("opened_by", "transaction", "dispute", "review", "created_at", "updated_at", "escalated_by", "escalated_at", "resolved_at")
    inlines = [SupportNoteInline, SupportAuditInline]
    actions = ["escalate_high_selected"]
    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False

    @admin.action(description="Escalate selected cases as high priority")
    def escalate_high_selected(self, request, queryset):
        for case in queryset:
            try:
                escalate_support_case(case, actor=request.user, reason="Escalated from support admin queue.")
            except Exception as exc:
                self.message_user(request, f"{case}: {exc}", level=messages.ERROR)


@admin.register(FraudSignal)
class FraudSignalAdmin(admin.ModelAdmin):
    list_display = ("code", "severity", "status", "profile", "transaction", "created_at")
    list_filter = ("status", "severity", "code", "created_at")
    search_fields = ("code", "profile__full_name", "profile__username", "transaction__receipt_number")
    readonly_fields = ("profile", "transaction", "dispute", "support_case", "code", "severity", "context", "created_at")
    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False
