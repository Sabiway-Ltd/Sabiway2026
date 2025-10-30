# posts/serializers.py

from rest_framework import serializers
from .models import Post, Hashtag, Like, Comment, Reply, Bookmark
from profiles.models import Profile
from profiles.serializers import ProfileSerializer
from .pagination import ReplyPagination

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
        request = self.context.get("request", None)
        if not request or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, "profile", request.user)
        return obj.likes.filter(user=profile).exists()

    def get_is_bookmarked(self, obj):  # ✅ new method
        request = self.context.get("request", None)
        if not request or not request.user.is_authenticated:
            return False
        user = request.user
        return obj.bookmarked_by.filter(user=user).exists()



class PostDetailSerializer(PostListSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta(PostListSerializer.Meta):
        model = Post
        fields = PostListSerializer.Meta.fields + ["content", "image"]

    # Keep your update logic unchanged
    def update(self, instance, validated_data):
        instance.content = validated_data.get("content", instance.content)
        instance.image = validated_data.get("image", instance.image)
        instance.save()

        old_tags = list(instance.hashtags.all())
        instance.hashtags.clear()
        instance.parse_and_attach_hashtags()

        for tag in old_tags:
            if tag not in instance.hashtags.all() and tag.use_count > 0:
                tag.use_count = tag.use_count - 1
                tag.save(update_fields=["use_count"])

        instance.refresh_from_db()
        return instance

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
        p = obj.user
        return {
            "user_id": p.user.id,
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
            "phone_number": p.phone_number,
        }

    def get_is_liked(self, obj):
        request = self.context.get("request", None)
        if not request or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, "profile", request.user)
        return obj.likes.filter(user=profile).exists()

    def create(self, validated_data):
        """
        Include image when creating a comment.
        """
        request = self.context["request"]
        profile = request.user.profile
        post = validated_data["post"]

        comment = Comment.objects.create(
            user=profile,
            post=post,
            content=validated_data.get("content"),
            image=validated_data.get("image", None),  # ✅ include image
        )

        post.comments_count = post.comments_count + 1
        post.save(update_fields=["comments_count"])
        return comment




class ReplySerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)
    nested_replies = serializers.SerializerMethodField()
    parent_reply_id = serializers.SerializerMethodField()
    parent_reply = serializers.PrimaryKeyRelatedField(
        queryset=Reply.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,  # 👈 so it can be POSTed but not shown in response
    )

    class Meta:
        model = Reply
        fields = [
            "id", "user", "comment", "parent_reply", "parent_reply_id",
            "content", "image", "likes_count", "created_at", "is_liked",
            "nested_replies"
        ]
        read_only_fields = [
            "id", "likes_count", "created_at", "user", "is_liked",
            "nested_replies", "parent_reply_id"
        ]


    def get_user(self, obj):
        p = obj.user
        return {
            "user_id": p.user.id,
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
            "phone_number": p.phone_number,
        }

    def get_is_liked(self, obj):
        request = self.context.get("request", None)
        if not request or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, "profile", request.user)
        return obj.likes.filter(user=profile).exists()

    def get_parent_reply_id(self, obj):
        return obj.parent_reply.id if obj.parent_reply else None  # ✅ safe for top-level replies

    def get_nested_replies(self, obj):
        """
        Recursively fetch nested replies (safe depth-limited).
        """
        depth = self.context.get("depth", 0)
        if depth >= 3:  # stop at depth 3
            return []

        qs = obj.child_replies.all().order_by("created_at")
        serializer = ReplySerializer(qs, many=True, context={**self.context, "depth": depth + 1})
        return serializer.data


    def create(self, validated_data):
        request = self.context["request"]
        profile = request.user.profile
        reply = Reply.objects.create(
            user=profile,
            comment=validated_data["comment"],
            parent_reply=validated_data.get("parent_reply"),
            content=validated_data.get("content"),
            image=validated_data.get("image", None),
        )
        return reply





class BookmarkSerializer(serializers.ModelSerializer):
    post = PostListSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ["id", "post", "created_at"]


class RepostSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(read_only=True)
    original_post_data = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Post  # ✅ Reposts are still stored in the Post model
        fields = [
            "id",
            "user",
            "content",
            "image",
            "created_at",
            "original_post",
            "original_post_data",
        ]
        read_only_fields = ["id", "created_at", "user", "image", "original_post_data"]

    def get_user(self, obj):
        p = obj.author
        return {
            "user_id": p.user.id,
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
        }

    def get_original_post_data(self, obj):
        if obj.original_post:
            return PostListSerializer(obj.original_post, context=self.context).data
        return None

    def create(self, validated_data):
        """
        Create a repost that duplicates text and image from the original post.
        """
        request = self.context["request"]
        user_profile = request.user.profile
        original_post = validated_data.get("original_post")

        if not original_post:
            raise serializers.ValidationError("Original post is required to repost.")

        repost = Post.objects.create(
            author=user_profile,
            content=validated_data.get("content") or original_post.content,
            image=original_post.image,
            original_post=original_post,
        )

        # copy hashtags
        repost.hashtags.set(original_post.hashtags.all())

        # increment repost count
        original_post.reposts_count += 1
        original_post.save(update_fields=["reposts_count"])

        return repost
