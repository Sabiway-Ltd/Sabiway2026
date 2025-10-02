# posts/serializers.py

from rest_framework import serializers
from .models import Post, Hashtag, Like, Comment, Reply, Bookmark, Repost
from profiles.models import Profile


class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = ["tag", "use_count"]


class PostListSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    hashtags = HashtagSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "author", "content", "image",
            "hashtags", "likes_count", "comments_count", 
            "impressions_count", "reposts_count", 
            "created_at", "updated_at",
        ]

    def get_author(self, obj):
        p = obj.author
        return {
            "user_id": p.user.id,
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
        }


class PostCreateSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = ["content", "image"]

    def create(self, validated_data):
        request = self.context["request"]
        profile = request.user.profile
        post = Post.objects.create(author=profile, **validated_data)
        # attach hashtags and increment counts
        post.parse_and_attach_hashtags()
        # increment profile posts_count
        profile.posts_count = profile.posts_count + 1
        profile.save(update_fields=["posts_count"])
        return post

    def update(self, instance, validated_data):
        instance.content = validated_data.get("content", instance.content)
        instance.image = validated_data.get("image", instance.image)
        instance.save()

        # re-parse hashtags when content is updated
        instance.hashtags.clear()
        instance.parse_and_attach_hashtags()

        # reload hashtags so serializer returns them
        instance.refresh_from_db()
        return instance


class PostDetailSerializer(PostListSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta(PostListSerializer.Meta):
        model = Post
        fields = PostListSerializer.Meta.fields + ["content", "image"]

    def update(self, instance, validated_data):
        instance.content = validated_data.get("content", instance.content)
        instance.image = validated_data.get("image", instance.image)
        instance.save()

        # track old hashtags
        old_tags = list(instance.hashtags.all())

        # re-parse hashtags
        instance.hashtags.clear()
        instance.parse_and_attach_hashtags()

        # decrement counts for tags that were removed
        for tag in old_tags:
            if tag not in instance.hashtags.all() and tag.use_count > 0:
                tag.use_count = tag.use_count - 1
                tag.save(update_fields=["use_count"])

        # reload hashtags for serializer response
        instance.refresh_from_db()
        return instance



class LikeSerializer(serializers.ModelSerializer):
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = Like
        fields = ["id", "user_id", "post", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_user_id(self, obj):
        return obj.user.user.id  # Profile.user.id

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "user", "post", "content", "likes_count", "created_at"]
        read_only_fields = ["id", "likes_count", "created_at", "user"]

    def get_user(self, obj):
        p = obj.user
        return {
            "user_id": p.user.id,
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
        }

    def create(self, validated_data):
        request = self.context["request"]
        profile = request.user.profile
        post = validated_data["post"]
        comment = Comment.objects.create(
            user=profile, post=post, content=validated_data["content"]
        )
        # increment comment count on post
        post.comments_count = post.comments_count + 1
        post.save(update_fields=["comments_count"])
        return comment


class ReplySerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Reply
        fields = ["id", "user", "comment", "content", "likes_count", "created_at"]
        read_only_fields = ["id", "likes_count", "created_at", "user"]

    def get_user(self, obj):
        p = obj.user
        return {
            "user_id": p.user.id,
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
        }

    def create(self, validated_data):
        request = self.context["request"]
        profile = request.user.profile
        comment = validated_data["comment"]
        reply = Reply.objects.create(
            user=profile, comment=comment, content=validated_data["content"]
        )
        return reply



class BookmarkSerializer(serializers.ModelSerializer):
    post = PostListSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ["id", "post", "created_at"]


class RepostSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Repost
        fields = ["id", "user", "post", "message", "created_at"]

    def get_user(self, obj):
        p = obj.user
        return {
            "user_id": p.user.id,
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
        }
