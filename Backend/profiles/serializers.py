from django.utils.text import slugify
from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    initials = serializers.CharField(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    posts_count = serializers.IntegerField(read_only=True)
    rating_average = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    rating_count = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(source="pk", read_only=True)
    is_following = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    verification_status = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "user_id", "full_name", "initials", "email", "username", "profile_picture",
            "followers_count", "following_count", "posts_count", "rating_average", "rating_count",
            "phone_number", "gender", "date_of_birth", "country", "state", "area", "street",
            "role", "job", "bio", "is_following", "address", "is_verified", "verification_status",
        ]
        read_only_fields = (
            "email", "initials", "followers_count", "following_count", "posts_count",
            "rating_average", "rating_count", "is_following", "address", "is_verified", "verification_status",
        )

    def _verification_state(self, instance):
        if instance.role != "professional":
            return "not_applicable"
        try:
            return instance.verification_submission.status
        except Exception:
            return "not_submitted"

    def get_is_verified(self, obj):
        return self._verification_state(obj) == "approved"

    def get_verification_status(self, obj):
        status = self._verification_state(obj)
        request = self.context.get("request")
        request_user = getattr(request, "user", None)
        is_owner = bool(request_user and request_user.is_authenticated and obj.user_id == request_user.id)
        is_staff = bool(request_user and request_user.is_authenticated and request_user.is_staff)
        if is_owner or is_staff:
            return status
        return "approved" if status == "approved" else "unverified"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        request_user = getattr(request, "user", None)
        is_owner = bool(request_user and request_user.is_authenticated and instance.user_id == request_user.id)
        is_staff = bool(request_user and request_user.is_authenticated and request_user.is_staff)
        if not (is_owner or is_staff):
            for field in ("email", "phone_number", "gender", "date_of_birth", "area", "street", "address"):
                data.pop(field, None)
        return data

    def validate_username(self, value):
        value = value.strip()
        if value.startswith("@"):
            value = value[1:]
        candidate = f"@{slugify(value)}"
        queryset = Profile.objects.filter(username=candidate)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("This username is taken.")
        return candidate

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def get_is_following(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            user_profile = getattr(request.user, "profile", None)
            if user_profile:
                return obj.followers_rel.filter(follower=user_profile).exists()
        return False
