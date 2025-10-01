from django.contrib import admin
from .models import Profile, Follow


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "username",
        "full_name",
        "get_email",
        "followers_count",
        "following_count",
        "posts_count",
    )
    search_fields = ("username", "full_name", "user__email")
    readonly_fields = ("followers_count", "following_count", "posts_count")

    def get_email(self, obj):
        """Return the email of the related user"""
        return obj.user.email
    get_email.short_description = "Email"


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("follower", "following", "created_at")
    search_fields = ("follower__username", "following__username")
    readonly_fields = ("created_at",)
