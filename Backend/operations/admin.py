from django.contrib import admin
from django.utils import timezone

from .models import OperationsAudit, PlatformConfiguration, ProductEvent, SupportCase, TechnicalMetric
from .services import notify_support_case, record_operations_audit


@admin.register(SupportCase)
class SupportCaseAdmin(admin.ModelAdmin):
    list_display = ("subject","category","status","priority","opened_by","assigned_to","created_at","updated_at")
    list_filter = ("status","priority","category","created_at")
    search_fields = ("subject","description","opened_by__email","opened_by__full_name","reference_id")
    readonly_fields = ("id","opened_by","created_at","updated_at","resolved_at")
    fields = ("id","opened_by","category","subject","description","status","priority","assigned_to","reference_type","reference_id","internal_note","resolved_at","created_at","updated_at")
    def has_add_permission(self, request): return bool(request.user.is_superuser or request.user.has_perm("operations.manage_support"))
    def has_change_permission(self, request, obj=None): return bool(request.user.is_superuser or request.user.has_perm("operations.manage_support"))
    def has_delete_permission(self, request, obj=None): return False
    def save_model(self, request, obj, form, change):
        previous={}
        if change and obj.pk:
            old=SupportCase.objects.get(pk=obj.pk); previous={"status":old.status,"priority":old.priority,"assigned_to":old.assigned_to_id}
        if obj.status in {SupportCase.Status.RESOLVED,SupportCase.Status.CLOSED} and not obj.resolved_at: obj.resolved_at=timezone.now()
        elif obj.status not in {SupportCase.Status.RESOLVED,SupportCase.Status.CLOSED}: obj.resolved_at=None
        if not obj.opened_by_id and not change: obj.opened_by=request.user
        super().save_model(request,obj,form,change)
        record_operations_audit(actor=request.user,action="support_case_admin_updated" if change else "support_case_admin_created",target_type="support_case",target_id=obj.id,previous_state=previous,new_state={"status":obj.status,"priority":obj.priority,"assigned_to":obj.assigned_to_id},metadata={"source":"django_admin"})
        if change and previous.get("status") != obj.status: notify_support_case(obj,actor=request.user)


@admin.register(PlatformConfiguration)
class PlatformConfigurationAdmin(admin.ModelAdmin):
    list_display=("key","description","updated_by","updated_at"); search_fields=("key","description"); readonly_fields=("created_at","updated_at","updated_by")
    def has_add_permission(self, request): return bool(request.user.is_superuser or request.user.has_perm("operations.manage_platform_config"))
    def has_change_permission(self, request, obj=None): return bool(request.user.is_superuser or request.user.has_perm("operations.manage_platform_config"))
    def has_delete_permission(self, request, obj=None): return bool(request.user.is_superuser)
    def save_model(self, request, obj, form, change):
        previous={}
        if change and obj.pk:
            old=PlatformConfiguration.objects.get(pk=obj.pk); previous={"value":old.value,"description":old.description}
        obj.full_clean(); obj.updated_by=request.user; super().save_model(request,obj,form,change)
        record_operations_audit(actor=request.user,action="platform_configuration_updated" if change else "platform_configuration_created",target_type="platform_configuration",target_id=obj.pk,previous_state=previous,new_state={"value":obj.value,"description":obj.description},metadata={"key":obj.key,"source":"django_admin"})


class ReadOnlyMeasurementAdmin(admin.ModelAdmin):
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


@admin.register(ProductEvent)
class ProductEventAdmin(ReadOnlyMeasurementAdmin):
    list_display=("created_at","event_name","source","actor")
    list_filter=("event_name","source","created_at")
    search_fields=("event_name","actor__email")
    readonly_fields=("id","event_name","actor","source","anonymous_id_hash","properties","created_at")


@admin.register(TechnicalMetric)
class TechnicalMetricAdmin(ReadOnlyMeasurementAdmin):
    list_display=("created_at","metric","route","status_code","latency_ms","success","source")
    list_filter=("metric","success","source","status_code","created_at")
    search_fields=("metric","route","actor__email")
    readonly_fields=("id","metric","route","status_code","latency_ms","success","actor","source","metadata","created_at")


@admin.register(OperationsAudit)
class OperationsAuditAdmin(ReadOnlyMeasurementAdmin):
    list_display=("created_at","actor","action","target_type","target_id")
    list_filter=("action","target_type","created_at")
    search_fields=("actor__email","action","target_type","target_id")
    readonly_fields=("id","actor","action","target_type","target_id","previous_state","new_state","metadata","created_at")
