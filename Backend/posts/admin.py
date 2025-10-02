# posts/admin.py

from django.contrib import admin
from .models import Post, Hashtag, Like, Comment, Reply

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "likes_count", "comments_count", "created_at")
    search_fields = ("author__username", "content")
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
