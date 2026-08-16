from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from .models import VerificationAudit, VerificationDocument, VerificationSubmission


class VerificationDocumentInline(admin.TabularInline):
    model = VerificationDocument
    extra = 0
    can_delete = False
    fields = ("kind", "filename", "content_type", "size", "submission_version", "created_at", "retention_until", "purged_at", "secure_download")
    readonly_fields = fields

    def secure_download(self, obj):
        if not obj.pk or obj.purged_at:
            return "Unavailable"
        url = reverse("verification-document-download", kwargs={"pk": obj.pk})
        return format_html('<a href="{}" target="_blank" rel="noopener">Secure download</a>', url)


@admin.register(VerificationSubmission)
class VerificationSubmissionAdmin(admin.ModelAdmin):
    list_display = ("professional", "status", "version", "reviewer", "submitted_at", "sla_due_at", "decision_at")
    list_filter = ("status", "identity_type", "submitted_at", "sla_due_at")
    search_fields = ("professional__full_name", "professional__username", "professional__user__email")
    readonly_fields = ("id", "professional", "status", "reviewer", "version", "submitted_at", "review_started_at", "decision_at", "sla_due_at", "decision_reason", "more_info_request", "created_at", "updated_at")
    inlines = [VerificationDocumentInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return bool(request.user.is_superuser or request.user.has_perm("verification.review_verification"))


@admin.register(VerificationDocument)
class VerificationDocumentAdmin(admin.ModelAdmin):
    list_display = ("submission", "kind", "filename", "size", "submission_version", "created_at", "retention_until", "purged_at")
    list_filter = ("kind", "purged_at", "created_at")
    search_fields = ("submission__professional__full_name", "submission__professional__username", "filename")
    readonly_fields = ("id", "submission", "submission_version", "kind", "filename", "content_type", "size", "checksum_sha256", "retention_until", "purged_at", "created_at")

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


@admin.register(VerificationAudit)
class VerificationAuditAdmin(admin.ModelAdmin):
    list_display = ("submission", "event", "actor", "from_status", "to_status", "created_at")
    list_filter = ("event", "from_status", "to_status", "created_at")
    search_fields = ("submission__professional__full_name", "submission__professional__username", "reason")
    readonly_fields = ("id", "submission", "actor", "event", "from_status", "to_status", "reason", "metadata", "created_at")

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
