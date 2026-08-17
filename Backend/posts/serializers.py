# posts/serializers.py

from rest_framework import serializers
from .models import Post, Hashtag, Like, Comment, Reply, Bookmark, PostReport
from profiles.serializers import ProfileSerializer


class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = ["tag", "use_count"]


class PostListSerializer(serializers.ModelSerializer):
    author = ProfileSerializer(read_only=True)
    hashtags = HashtagSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    original_post_data = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "author", "content", "image",
            "hashtags", "likes_count", "comments_count",
            "impressions_count", "reposts_count",
            "created_at", "updated_at",
            "is_liked", "is_bookmarked", "original_post", "original_post_data",
        ]

    def get_original_post_data(self, obj):
        if obj.original_post:
            return PostListSerializer(obj.original_post, context=self.context).data
        return None

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, "profile", request.user)
        return obj.likes.filter(user=profile).exists()

    def get_is_bookmarked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.bookmarked_by.filter(user=request.user).exists()


class PostDetailSerializer(PostListSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta(PostListSerializer.Meta):
        model = Post
        fields = PostListSerializer.Meta.fields

    def update(self, instance, validated_data):
        instance.content = validated_data.get("content", instance.content)
        instance.image = validated_data.get("image", instance.image)
        old_tags = list(instance.hashtags.all())
        instance.save()
        instance.hashtags.clear()
        instance.parse_and_attach_hashtags()

        current_tag_ids = set(instance.hashtags.values_list("id", flat=True))
        for tag in old_tags:
            if tag.id not in current_tag_ids and tag.use_count > 0:
                tag.use_count -= 1
                tag.save(update_fields=["use_count"])

        instance.refresh_from_db()
        return instance


class PostCreateSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = ["content", "image"]

    def validate(self, attrs):
        content = str(attrs.get("content", "")).strip()
        if not content and not attrs.get("image"):
            raise serializers.ValidationError("A post needs text or an image.")
        if "content" in attrs:
            attrs["content"] = content
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        profile = request.user.profile
        post = Post.objects.create(author=profile, **validated_data)
        post.parse_and_attach_hashtags()
        profile.posts_count += 1
        profile.save(update_fields=["posts_count"])
        return post

    def update(self, instance, validated_data):
        instance.content = validated_data.get("content", instance.content)
        instance.image = validated_data.get("image", instance.image)
        instance.save()
        instance.hashtags.clear()
        instance.parse_and_attach_hashtags()
        instance.refresh_from_db()
        return instance


class LikeSerializer(serializers.ModelSerializer):
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = Like
        fields = ["id", "user_id", "post", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_user_id(self, obj):
        return obj.user.user.id


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    reply_count = serializers.IntegerField(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Comment
        fields = [
            "id", "user", "post", "content", "image",
            "likes_count", "created_at", "is_liked", "reply_count",
        ]
        read_only_fields = ["id", "likes_count", "created_at", "user", "is_liked", "reply_count"]

    def get_user(self, obj):
        profile = obj.user
        return {
            "user_id": profile.user.id,
            "username": profile.username,
            "full_name": profile.full_name,
            "profile_picture": str(profile.profile_picture) if profile.profile_picture else None,
            "job": profile.job,
        }

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, "profile", request.user)
        return obj.likes.filter(user=profile).exists()

    def validate(self, attrs):
        post = attrs.get("post") or getattr(self.instance, "post", None)
        if post and post.is_hidden:
            raise serializers.ValidationError({"post": "Comments are not available on a hidden post."})
        content = str(attrs.get("content", getattr(self.instance, "content", ""))).strip()
        image = attrs.get("image", getattr(self.instance, "image", None))
        if not content and not image:
            raise serializers.ValidationError("A comment needs text or an image.")
        if "content" in attrs:
            attrs["content"] = content
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        profile = request.user.profile
        post = validated_data["post"]
        comment = Comment.objects.create(
            user=profile,
            post=post,
            content=validated_data.get("content", ""),
            image=validated_data.get("image"),
        )
        post.comments_count += 1
        post.save(update_fields=["comments_count"])
        return comment


class ReplySerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)
    nested_replies = serializers.SerializerMethodField()
    parent_reply_id = serializers.SerializerMethodField()
    parent_reply = serializers.PrimaryKeyRelatedField(
        queryset=Reply.objects.select_related("comment__post").all(),
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Reply
        fields = [
            "id", "user", "comment", "parent_reply", "parent_reply_id",
            "content", "image", "likes_count", "created_at", "is_liked",
            "nested_replies",
        ]
        read_only_fields = [
            "id", "likes_count", "created_at", "user", "is_liked",
            "nested_replies", "parent_reply_id",
        ]

    def get_user(self, obj):
        profile = obj.user
        return {
            "user_id": profile.user.id,
            "username": profile.username,
            "full_name": profile.full_name,
            "profile_picture": str(profile.profile_picture) if profile.profile_picture else None,
            "job": profile.job,
        }

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, "profile", request.user)
        return obj.likes.filter(user=profile).exists()

    def get_parent_reply_id(self, obj):
        return obj.parent_reply.id if obj.parent_reply else None

    def get_nested_replies(self, obj):
        depth = self.context.get("depth", 0)
        if depth >= 3:
            return []
        queryset = obj.child_replies.select_related("user__user").order_by("created_at")
        return ReplySerializer(
            queryset,
            many=True,
            context={**self.context, "depth": depth + 1},
        ).data

    def validate(self, attrs):
        comment = attrs.get("comment") or getattr(self.instance, "comment", None)
        parent = attrs.get("parent_reply")
        if comment and comment.post.is_hidden:
            raise serializers.ValidationError({"comment": "Replies are not available on a hidden post."})
        if parent and comment and parent.comment_id != comment.id:
            raise serializers.ValidationError({"parent_reply": "Parent reply must belong to the same comment."})
        if parent and parent.comment.post.is_hidden:
            raise serializers.ValidationError({"parent_reply": "Replies are not available on a hidden post."})
        content = str(attrs.get("content", getattr(self.instance, "content", ""))).strip()
        image = attrs.get("image", getattr(self.instance, "image", None))
        if not content and not image:
            raise serializers.ValidationError("A reply needs text or an image.")
        if "content" in attrs:
            attrs["content"] = content
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return Reply.objects.create(
            user=request.user.profile,
            comment=validated_data["comment"],
            parent_reply=validated_data.get("parent_reply"),
            content=validated_data.get("content", ""),
            image=validated_data.get("image"),
        )


class BookmarkSerializer(serializers.ModelSerializer):
    post = PostListSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ["id", "post", "created_at"]


class RepostSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(read_only=True)
    original_post_data = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "user", "content", "image", "created_at",
            "original_post", "original_post_data",
        ]
        read_only_fields = ["id", "created_at", "user", "image", "original_post_data"]

    def get_user(self, obj):
        profile = obj.author
        return {
            "user_id": profile.user.id,
            "username": profile.username,
            "full_name": profile.full_name,
            "profile_picture": str(profile.profile_picture) if profile.profile_picture else None,
        }

    def get_original_post_data(self, obj):
        if obj.original_post:
            return PostListSerializer(obj.original_post, context=self.context).data
        return None

    def create(self, validated_data):
        request = self.context["request"]
        user_profile = request.user.profile
        original_post = validated_data.get("original_post")
        if not original_post:
            raise serializers.ValidationError("Original post is required to repost.")
        if original_post.is_hidden:
            raise serializers.ValidationError("A hidden post cannot be reposted.")

        repost = Post.objects.create(
            author=user_profile,
            content=validated_data.get("content") or original_post.content,
            image=original_post.image,
            original_post=original_post,
        )
        repost.hashtags.set(original_post.hashtags.all())
        original_post.reposts_count += 1
        original_post.save(update_fields=["reposts_count"])
        return repost


class PostReportSerializer(serializers.Serializer):
    post_id = serializers.UUIDField()
    reason = serializers.CharField(min_length=3, max_length=1000, trim_whitespace=True)
    post_url = serializers.URLField()

    def validate_post_id(self, value):
        if not Post.objects.filter(id=value).exists():
            raise serializers.ValidationError("Post does not exist.")
        return value
