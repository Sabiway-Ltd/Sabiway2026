from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "type", "actor", "is_read", "created_at")
    list_filter = ("type", "is_read", "created_at")
    search_fields = ("user__full_name", "user__username", "actor__full_name", "message")
    readonly_fields = ("id", "user", "actor", "type", "message", "target_content_type", "target_object_id", "is_read", "created_at")

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
