# notifications/serializers.py

from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    target_type = serializers.SerializerMethodField()
    target_id = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "actor",
            "target_type",
            "target_id",
            "message",
            "is_read",
            "created_at"
        ]

    def get_actor(self, obj):
        p = obj.actor
        return {
            "user_id": p.user.id,
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
        }

    def get_target_type(self, obj):
        if obj.target:
            return obj.target._meta.model_name
        return None

    def get_target_id(self, obj):
        if obj.target:
            return obj.target.pk
        return None
