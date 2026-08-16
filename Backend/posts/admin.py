from django.contrib import admin

from .models import Comment, Hashtag, Like, ModerationAudit, Post, PostReport, Reply


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "is_hidden", "likes_count", "comments_count", "created_at")
    list_filter = ("is_hidden",)
    search_fields = ("author__username", "content", "moderation_reason")
    readonly_fields = ("likes_count", "comments_count", "impressions_count")


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
    readonly_fields = ("created_at",)


@admin.register(ModerationAudit)
class ModerationAuditAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "report", "action", "actor", "created_at")
    list_filter = ("action",)
    readonly_fields = ("report", "post", "actor", "action", "note", "created_at")
