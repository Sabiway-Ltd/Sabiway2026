from rest_framework import serializers
from .models import Notification
from posts.models import Post, Comment, Reply
from profiles.models import Profile


class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    target = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "type", "actor", "target", "message", "is_read", "created_at"]

    def get_actor(self, obj):
        p = obj.actor
        if not p:
            return {"user_id": None, "username": "sabiway", "full_name": "SabiWay", "profile_picture": None}
        return {
            "user_id": p.user.id,
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
        }

    def get_target(self, obj):
        if not obj.target:
            return None
        model_name = obj.target._meta.model_name
        if isinstance(obj.target, Profile):
            return {"type": "profile", "id": obj.target.user.id, "username": obj.target.username, "full_name": obj.target.full_name}
        if isinstance(obj.target, Post):
            return {"type": "post", "id": obj.target.id, "slug": getattr(obj.target, "slug", None), "content_preview": getattr(obj.target, "content", "")[:100]}
        if isinstance(obj.target, Comment):
            return {"type": "comment", "id": obj.target.id, "post_id": obj.target.post.id, "post_slug": getattr(obj.target.post, "slug", None), "text_preview": getattr(obj.target, "text", "")[:100]}
        if isinstance(obj.target, Reply):
            return {"type": "reply", "id": obj.target.id, "comment_id": obj.target.comment.id, "post_id": obj.target.comment.post.id, "text_preview": getattr(obj.target, "text", "")[:100]}
        return {"type": model_name, "id": str(obj.target.pk)}
