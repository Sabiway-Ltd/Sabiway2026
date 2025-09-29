# profiles/serializers.py
from rest_framework import serializers
from .models import Profile
from django.utils.text import slugify


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)
    initials = serializers.CharField(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    posts_count = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'user_id', 'full_name', 'initials', 'email', 'username', 'profile_picture',
            'followers_count', 'following_count', 'posts_count', 'whatsapp_number',
        ]
        read_only_fields = ('email', 'initials', 'followers_count', 'following_count', 'posts_count')

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
        instance.whatsapp_number = validated_data.get('whatsapp_number', instance.whatsapp_number)
        instance.save()
        return instance