from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.core.exceptions import PermissionDenied

from operations.services import record_operations_audit

from .models import PasswordReset, PendingSignup, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "full_name", "role", "is_active", "is_staff", "is_superuser")
    list_filter = ("role", "is_active", "is_staff", "is_superuser", "groups")
    search_fields = ("email", "full_name")
    readonly_fields = ("last_login",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identity", {"fields": ("full_name", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "full_name", "role", "password1", "password2", "is_active", "is_staff")}),
    )

    def get_readonly_fields(self, request, obj=None):
        base = list(super().get_readonly_fields(request, obj))
        if request.user.is_superuser:
            return tuple(base)
        if request.user.has_perm("operations.manage_operational_roles"):
            return tuple(dict.fromkeys(base + ["is_superuser", "user_permissions"]))
        return tuple(dict.fromkeys(base + ["role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions"]))

    def has_change_permission(self, request, obj=None):
        return bool(request.user.is_superuser or request.user.has_perm("accounts.change_user"))

    def has_delete_permission(self, request, obj=None):
        return bool(request.user.is_superuser)

    def save_model(self, request, obj, form, change):
        previous = {}
        if change and obj.pk:
            old = User.objects.get(pk=obj.pk)
            previous = {
                "role": old.role,
                "is_active": old.is_active,
                "is_staff": old.is_staff,
                "is_superuser": old.is_superuser,
            }
            request._sabiway_previous_groups = list(old.groups.values_list("name", flat=True))
        if obj.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Only a super admin can grant super-admin access.")
        super().save_model(request, obj, form, change)
        record_operations_audit(
            actor=request.user,
            action="user_admin_updated" if change else "user_admin_created",
            target_type="user",
            target_id=obj.pk,
            previous_state=previous,
            new_state={
                "role": obj.role,
                "is_active": obj.is_active,
                "is_staff": obj.is_staff,
                "is_superuser": obj.is_superuser,
            },
            metadata={"email": obj.email, "source": "django_admin"},
        )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        if not change:
            return
        previous = sorted(getattr(request, "_sabiway_previous_groups", []))
        current = sorted(form.instance.groups.values_list("name", flat=True))
        if previous != current:
            record_operations_audit(
                actor=request.user,
                action="user_operational_roles_changed",
                target_type="user",
                target_id=form.instance.pk,
                previous_state={"groups": previous},
                new_state={"groups": current},
                metadata={"email": form.instance.email, "source": "django_admin"},
            )


@admin.register(PendingSignup)
class PendingSignupAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "role", "created_at", "is_used")
    list_filter = ("role", "is_used")
    search_fields = ("email", "full_name")
    readonly_fields = ("token", "code", "created_at", "password_hash")


@admin.register(PasswordReset)
class PasswordResetAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "is_used")
    list_filter = ("is_used",)
    search_fields = ("user__email", "user__full_name")
    readonly_fields = ("reset_token", "code", "created_at")
