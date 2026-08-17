from django.contrib import admin
from django.utils import timezone

from operations.services import record_operations_audit

from .models import Comment, Hashtag, Like, ModerationAudit, Post, PostReport, Reply


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "is_hidden", "likes_count", "comments_count", "created_at")
    list_filter = ("is_hidden",)
    search_fields = ("author__username", "content", "moderation_reason")
    readonly_fields = ("likes_count", "comments_count", "impressions_count")

    def get_readonly_fields(self, request, obj=None):
        fields = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            fields.extend(["is_hidden", "moderation_reason"])
        return tuple(dict.fromkeys(fields))


@admin.register(Hashtag)
class HashtagAdmin(admin.ModelAdmin):
    list_display = ("tag", "use_count")
    search_fields = ("tag",)


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "created_at")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "post", "created_at")


@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "comment", "created_at")


@admin.register(PostReport)
class PostReportAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "status", "reported_by", "reviewed_by", "created_at", "reviewed_at")
    list_filter = ("status",)
    search_fields = ("post__content", "reason", "resolution_note")
    readonly_fields = ("created_at", "reported_by", "post", "post_url")

    def has_change_permission(self, request, obj=None):
        return bool(request.user.is_superuser or request.user.has_perm("posts.change_postreport"))

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        old_status = ""
        old_note = ""
        if change and obj.pk:
            previous = PostReport.objects.select_related("post").get(pk=obj.pk)
            old_status = previous.status
            old_note = previous.resolution_note
        if change and old_status != obj.status:
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
            if obj.status == PostReport.Status.REMOVED:
                obj.post.is_hidden = True
                obj.post.moderation_reason = obj.resolution_note or obj.reason
                obj.post.save(update_fields=["is_hidden", "moderation_reason", "updated_at"])
            elif obj.status == PostReport.Status.RESTORED:
                obj.post.is_hidden = False
                obj.post.moderation_reason = ""
                obj.post.save(update_fields=["is_hidden", "moderation_reason", "updated_at"])
        super().save_model(request, obj, form, change)
        if change and old_status != obj.status:
            action_map = {
                PostReport.Status.DISMISSED: ModerationAudit.Action.DISMISSED,
                PostReport.Status.REMOVED: ModerationAudit.Action.REMOVED,
                PostReport.Status.RESTORED: ModerationAudit.Action.RESTORED,
            }
            action = action_map.get(obj.status)
            if action:
                ModerationAudit.objects.create(
                    report=obj,
                    post=obj.post,
                    actor=request.user,
                    action=action,
                    note=obj.resolution_note,
                )
            record_operations_audit(
                actor=request.user,
                action="content_report_status_changed",
                target_type="post_report",
                target_id=obj.pk,
                previous_state={"status": old_status, "resolution_note": old_note},
                new_state={"status": obj.status, "resolution_note": obj.resolution_note, "post_hidden": obj.post.is_hidden},
                metadata={"post_id": str(obj.post_id), "source": "django_admin"},
            )


@admin.register(ModerationAudit)
class ModerationAuditAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "report", "action", "actor", "created_at")
    list_filter = ("action",)
    readonly_fields = ("report", "post", "actor", "action", "note", "created_at")

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
