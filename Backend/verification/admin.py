from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html

from .models import VerificationAudit, VerificationDocument, VerificationSubmission
from .services import audit


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


class VerificationSubmissionAdminForm(forms.ModelForm):
    class Meta:
        model = VerificationSubmission
        fields = ("status", "decision_reason", "more_info_request")
        widgets = {
            "decision_reason": forms.Textarea(attrs={"rows": 4}),
            "more_info_request": forms.Textarea(attrs={"rows": 4}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.initial_status = self.instance.status if self.instance and self.instance.pk else None

    def clean(self):
        cleaned = super().clean()
        target = cleaned.get("status")
        if target != self.initial_status:
            if self.initial_status not in {VerificationSubmission.Status.SUBMITTED, VerificationSubmission.Status.IN_REVIEW}:
                raise ValidationError("Only a submitted or in-review case can receive a new decision. Ask the professional to resubmit after rejection or a request for more information.")
            if target not in {
                VerificationSubmission.Status.IN_REVIEW,
                VerificationSubmission.Status.APPROVED,
                VerificationSubmission.Status.REJECTED,
                VerificationSubmission.Status.MORE_INFO,
            }:
                raise ValidationError("This verification status transition is not allowed.")
        if target == VerificationSubmission.Status.REJECTED and not (cleaned.get("decision_reason") or "").strip():
            self.add_error("decision_reason", "A rejection reason is required.")
        if target == VerificationSubmission.Status.MORE_INFO and not (cleaned.get("more_info_request") or "").strip():
            self.add_error("more_info_request", "Explain what additional information is required.")
        return cleaned


@admin.register(VerificationSubmission)
class VerificationSubmissionAdmin(admin.ModelAdmin):
    form = VerificationSubmissionAdminForm
    list_display = ("professional", "status", "version", "reviewer", "submitted_at", "sla_due_at", "sla_overdue", "decision_at")
    list_filter = ("status", "identity_type", "submitted_at", "sla_due_at")
    search_fields = ("professional__full_name", "professional__username", "professional__user__email")
    readonly_fields = ("id", "professional", "identity_type", "credential_summary", "address_line", "city", "state", "country", "reviewer", "version", "submitted_at", "review_started_at", "decision_at", "sla_due_at", "created_at", "updated_at")
    fields = (
        "id", "professional", "identity_type", "credential_summary", "address_line", "city", "state", "country",
        "status", "decision_reason", "more_info_request", "reviewer", "version", "submitted_at", "review_started_at",
        "sla_due_at", "decision_at", "created_at", "updated_at",
    )
    inlines = [VerificationDocumentInline]

    @admin.display(boolean=True, description="SLA overdue")
    def sla_overdue(self, obj):
        return bool(obj.sla_due_at and not obj.decision_at and obj.sla_due_at < timezone.now())

    def save_model(self, request, obj, form, change):
        old_status = form.initial_status or ""
        target = obj.status
        changed = old_status != target
        if changed:
            obj.reviewer = request.user
            now = timezone.now()
            if target == VerificationSubmission.Status.IN_REVIEW and not obj.review_started_at:
                obj.review_started_at = now
            if target in {VerificationSubmission.Status.APPROVED, VerificationSubmission.Status.REJECTED, VerificationSubmission.Status.MORE_INFO}:
                obj.decision_at = now
                if target == VerificationSubmission.Status.MORE_INFO:
                    obj.decision_reason = ""
                else:
                    obj.more_info_request = ""
        super().save_model(request, obj, form, change)
        if changed:
            reason = obj.more_info_request if target == VerificationSubmission.Status.MORE_INFO else obj.decision_reason
            audit(
                obj,
                "review_started" if target == VerificationSubmission.Status.IN_REVIEW else "decision",
                actor=request.user,
                old=old_status,
                new=target,
                reason=reason,
                metadata={"version": obj.version, "source": "django_admin"},
            )

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
