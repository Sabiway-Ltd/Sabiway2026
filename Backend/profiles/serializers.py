# profiles/serializers.py

from rest_framework import serializers
from .models import Profile
from django.utils.text import slugify


class ProfileSerializer(serializers.ModelSerializer):
    # Pull email from related User
    email = serializers.EmailField(source='user.email', read_only=True)
    initials = serializers.CharField(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    posts_count = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(source='pk', read_only=True)
    is_following = serializers.SerializerMethodField()


    class Meta:
        model = Profile
        fields = [
            'user_id', 'full_name', 'initials', 'email', 'username', 'profile_picture',
            'followers_count', 'following_count', 'posts_count', 'phone_number',
            'gender', 'date_of_birth', 'address', 'bio', 'is_following'
        ]
        read_only_fields = (
            'email', 'initials', 'followers_count', 'following_count',
            'posts_count', 'is_following'
        )

    def validate_username(self, value):
        v = value.strip()
        if v.startswith('@'):
            v = v[1:]
        v = slugify(v)
        candidate = f"@{v}"
        qs = Profile.objects.filter(username=candidate)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This username is taken.')
        return candidate

    def update(self, instance, validated_data):
        username = validated_data.get('username')
        if username:
            instance.username = username
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.save()
        return instance
    
    def get_is_following(self, obj):
        """Check if logged-in user is following this profile"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user_profile = getattr(request.user, 'profile', None)
            if user_profile:
                return obj.followers_rel.filter(follower=user_profile).exists()
        return False
    
    
