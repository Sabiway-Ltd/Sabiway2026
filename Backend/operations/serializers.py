from django.utils import timezone
from rest_framework import serializers

from accounts.models import User

from .models import SupportCase


class SupportCaseSerializer(serializers.ModelSerializer):
    opened_by_email = serializers.EmailField(source="opened_by.email", read_only=True)
    assigned_to_email = serializers.EmailField(source="assigned_to.email", read_only=True)

    class Meta:
        model = SupportCase
        fields = [
            "id", "opened_by_email", "category", "subject", "description", "status", "priority",
            "assigned_to", "assigned_to_email", "reference_type", "reference_id", "internal_note",
            "resolved_at", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "priority", "assigned_to", "internal_note", "resolved_at", "created_at", "updated_at"]

    def validate_subject(self, value):
        value = value.strip()
        if len(value) < 4:
            raise serializers.ValidationError("Give the support request a short descriptive subject.")
        return value

    def validate_description(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Add enough detail for support to understand the problem.")
        return value


class SupportCaseStaffUpdateSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_staff=True), allow_null=True, required=False)

    class Meta:
        model = SupportCase
        fields = ["status", "priority", "assigned_to", "internal_note"]

    def update(self, instance, validated_data):
        target_status = validated_data.get("status", instance.status)
        if target_status in {SupportCase.Status.RESOLVED, SupportCase.Status.CLOSED} and not instance.resolved_at:
            instance.resolved_at = timezone.now()
        elif target_status not in {SupportCase.Status.RESOLVED, SupportCase.Status.CLOSED}:
            instance.resolved_at = None
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
