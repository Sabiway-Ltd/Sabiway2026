from rest_framework import serializers

from posts.models import Comment, Post, Reply
from profiles.models import Profile

from .models import Notification, NotificationDelivery, NotificationPreference, PushDevice


class NotificationDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationDelivery
        fields = ["channel", "status", "provider_reference", "error", "attempted_at", "sent_at"]


class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    target = serializers.SerializerMethodField()
    deliveries = NotificationDeliverySerializer(many=True, read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id", "type", "actor", "target", "message", "deep_link", "metadata",
            "is_read", "deliveries", "created_at",
        ]

    def get_actor(self, obj):
        p = obj.actor
        if not p:
            return None
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
        return {"type": model_name, "id": obj.target.pk}


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ["push_enabled", "email_enabled", "payment_email_enabled", "dispute_email_enabled", "updated_at"]
        read_only_fields = ["updated_at"]


class PushDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushDevice
        fields = ["id", "token", "platform", "device_name", "is_active", "last_seen_at", "created_at"]
        read_only_fields = ["id", "last_seen_at", "created_at"]

    def create(self, validated_data):
        profile = self.context["request"].user.profile
        token = validated_data["token"].strip()
        device, _ = PushDevice.objects.update_or_create(
            token=token,
            defaults={
                "profile": profile,
                "platform": validated_data["platform"],
                "device_name": validated_data.get("device_name", ""),
                "is_active": validated_data.get("is_active", True),
            },
        )
        from django.utils import timezone
        device.last_seen_at = timezone.now()
        device.save(update_fields=["last_seen_at"])
        return device
