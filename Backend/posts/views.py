# posts/views.py

from django.shortcuts import get_object_or_404
from django.db import models, transaction
from django.db.models import Count, F
from rest_framework import viewsets, status, generics, serializers, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from .pagination import ReplyPagination
from django.db.models import Q, Case, When, IntegerField
from profiles.models import Follow
from profiles.models import Profile
from .models import (
    Post, Like, Comment, Reply, Hashtag, Bookmark,
    CommentLike, ReplyLike, PostImpression
)
from .serializers import (
    PostListSerializer, PostCreateSerializer, PostDetailSerializer,
    LikeSerializer, CommentSerializer, ReplySerializer,
    HashtagSerializer, BookmarkSerializer
)
from .pagination import PostPagination


# ------------------------
# IMPRESSION TRACKING MIXIN
# ------------------------
class ImpressionTrackingMixin:
    def track_impressions(self, request, posts):
        """Track unique impressions per user per post."""
        user = getattr(request.user, "profile", None)
        if not user:
            return

        post_ids = [obj.id for obj in posts]
        if not post_ids:
            return

        existing_ids = set(
            PostImpression.objects.filter(user=user, post_id__in=post_ids)
            .values_list("post_id", flat=True)
        )
        new_post_ids = set(post_ids) - existing_ids

        if not new_post_ids:
            return

        PostImpression.objects.bulk_create([
            PostImpression(post_id=pid, user=user)
            for pid in new_post_ids
        ], ignore_conflicts=True)

        Post.objects.filter(id__in=new_post_ids).update(
            impressions_count=F("impressions_count") + 1
        )


# ------------------------
# HASHTAGS
# ------------------------
class HashtagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hashtag.objects.all().order_by("-use_count")
    serializer_class = HashtagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


# ------------------------
# POSTS
# ------------------------
class PostViewSet(ImpressionTrackingMixin, viewsets.ModelViewSet):
    queryset = Post.objects.select_related("author__user").prefetch_related("hashtags").all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = PostPagination

    def get_serializer_class(self):
        if self.action == "create":
            return PostCreateSerializer
        if self.action == "retrieve":
            return PostDetailSerializer
        return PostListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.is_authenticated and hasattr(user, "profile"):
            profile = user.profile

            # Get IDs of users this profile follows
            following_ids = Follow.objects.filter(follower=profile).values_list("following_id", flat=True)
            # Get IDs of users who follow this profile
            follower_ids = Follow.objects.filter(following=profile).values_list("follower_id", flat=True)

            related_ids = set(following_ids) | set(follower_ids)

            # Annotate rank:
            # 0 = user's own posts
            # 1 = followed/followers
            # 2 = everyone else
            qs = qs.annotate(
                rank=Case(
                    When(author=profile, then=0),
                    When(author__in=related_ids, then=1),
                    default=2,
                    output_field=IntegerField(),
                )
            ).order_by("rank", "-created_at")

        else:
            qs = qs.order_by("-created_at")

        return qs


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        full_serializer = PostDetailSerializer(post, context={"request": request})
        return Response(full_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        full_serializer = PostDetailSerializer(post, context={"request": request})
        return Response(full_serializer.data, status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        author_profile = instance.author
        author_profile.posts_count = max(0, author_profile.posts_count - 1)
        author_profile.save(update_fields=["posts_count"])

        for tag in instance.hashtags.all():
            if tag.use_count > 0:
                tag.use_count -= 1
                tag.save(update_fields=["use_count"])
        instance.delete()

    # ----- Likes -----
    @action(detail=True, methods=["post"], url_path="like")
    def like(self, request, pk=None):
        post = self.get_object()
        profile = getattr(request.user, "profile", request.user)
        obj, created = Like.objects.get_or_create(user=profile, post=post)
        if created:
            post.likes_count += 1
            post.save(update_fields=["likes_count"])
            return Response({"detail": "Liked"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already liked"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="unlike")
    def unlike(self, request, pk=None):
        post = self.get_object()
        profile = getattr(request.user, "profile", request.user)
        deleted, _ = Like.objects.filter(user=profile, post=post).delete()
        if deleted:
            post.likes_count = max(0, post.likes_count - 1)
            post.save(update_fields=["likes_count"])
            return Response({"detail": "Unliked"}, status=status.HTTP_200_OK)
        return Response({"detail": "Not liked"}, status=status.HTTP_400_BAD_REQUEST)

    # ----- Comments -----
    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        post = self.get_object()

        if request.method == "GET":
            qs = post.comments.select_related("user__user") \
                .annotate(reply_count=Count("replies")) \
                .order_by("-created_at")
            serializer = CommentSerializer(qs, many=True, context={"request": request})
            return Response(serializer.data)

        if request.method == "POST":
            data = request.data.copy()
            data["post"] = str(post.id)
            serializer = CommentSerializer(data=data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            comment = serializer.save()
            return Response(CommentSerializer(comment, context={"request": request}).data,
                            status=status.HTTP_201_CREATED)

    # ----- Replies -----
    @action(detail=True, methods=["get"], url_path="replies")
    def list_replies(self, request, pk=None):
        post = self.get_object()
        replies = Reply.objects.filter(comment__post=post).select_related("user__user")
        serializer = ReplySerializer(replies, many=True, context={"request": request})
        return Response(serializer.data)

    # ----- Posts by Username -----
    @action(detail=False, methods=["get"], url_path=r"user/(?P<username>[\w.@+-]+)")
    def user_posts(self, request, username=None):
        if username.startswith("@"):
            username = username[1:]
        profile = get_object_or_404(Profile, username=f"@{username}")
        posts = Post.objects.filter(author=profile).select_related("author__user").prefetch_related("hashtags").order_by("-created_at")
        paginator = PostPagination()
        paginated_posts = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(paginated_posts, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    # ----- Track Impressions -----
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        results = response.data.get("results", response.data)
        post_ids = [item["id"] for item in results]
        posts = Post.objects.filter(id__in=post_ids)
        self.track_impressions(request, posts)
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        post = self.get_object()
        self.track_impressions(request, [post])
        return response





class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("user__user", "post").all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        post = instance.post
        post.comments_count = max(0, post.comments_count - 1)
        post.save(update_fields=["comments_count"])
        instance.delete()
    
    # ✅ New action to fetch all replies for a specific comment
    @action(detail=True, methods=["get"], url_path="replies")
    def get_replies(self, request, pk=None):
        comment = self.get_object()
        replies = comment.replies.select_related("user__user").all().order_by("created_at")
        serializer = ReplySerializer(replies, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReplyViewSet(viewsets.ModelViewSet):
    queryset = Reply.objects.all().select_related('user', 'comment', 'parent_reply')
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        user = request.user.profile  # ✅ Use Profile, not raw user

        comment_id = data.get("comment")
        parent_reply_id = data.get("parent_reply")

        # If replying to a reply, inherit its comment automatically
        if parent_reply_id and not comment_id:
            try:
                parent_reply = Reply.objects.get(id=parent_reply_id)
                data["comment"] = str(parent_reply.comment.id)
                data["parent_reply"] = str(parent_reply.id)  # ✅ Ensure this stays attached
            except Reply.DoesNotExist:
                return Response(
                    {"error": "Parent reply not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)




class LikeViewSet(viewsets.ModelViewSet):
    queryset = Like.objects.select_related("user__user", "post").all()
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        post = serializer.validated_data["post"]
        like, created = Like.objects.get_or_create(user=user, post=post)
        if not created:
            raise serializers.ValidationError({"detail": "Already liked"})
        return like

    def perform_destroy(self, instance):
        post = instance.post
        if post.likes_count > 0:
            post.likes_count = max(0, post.likes_count - 1)
            post.save(update_fields=["likes_count"])
        instance.delete()


class BookmarkPostView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    def post(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=kwargs.get("id") or kwargs.get("pk"))
        user_obj = request.user  # ✅ Use User, not Profile
        bookmark, created = Bookmark.objects.get_or_create(user=user_obj, post=post)
        if not created:
            return Response({"detail": "Already bookmarked"}, status=status.HTTP_200_OK)
        return Response(
            BookmarkSerializer(bookmark, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )


class UnbookmarkPostView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=kwargs.get("id") or kwargs.get("pk"))
        user_obj = request.user  # ✅ Use User, not Profile
        deleted, _ = Bookmark.objects.filter(user=user_obj, post=post).delete()
        if deleted:
            return Response({"detail": "Unbookmarked"}, status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Not bookmarked"}, status=status.HTTP_400_BAD_REQUEST)


class MyBookmarksView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    def get_queryset(self):
        user_obj = self.request.user  # ✅ Use User, not Profile
        return (
            Bookmark.objects.filter(user=user_obj)
            .select_related("post")
            .order_by("-created_at")
        )




class TrendingHashtagsView(generics.ListAPIView):
    serializer_class = HashtagSerializer

    def get_queryset(self):
        return Hashtag.objects.order_by("-use_count")[:10]






class CommentLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        profile = getattr(request.user, "profile", request.user)
        comment = get_object_or_404(Comment, id=id)
        like, created = CommentLike.objects.get_or_create(user=profile, comment=comment)
        if created:
            comment.likes_count += 1
            comment.save(update_fields=["likes_count"])
            return Response({"detail": "Comment liked"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already liked"}, status=status.HTTP_200_OK)


class CommentUnlikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        profile = getattr(request.user, "profile", request.user)
        comment = get_object_or_404(Comment, id=id)
        deleted, _ = CommentLike.objects.filter(user=profile, comment=comment).delete()
        if deleted:
            comment.likes_count = max(0, comment.likes_count - 1)
            comment.save(update_fields=["likes_count"])
            return Response({"detail": "Comment unliked"}, status=status.HTTP_200_OK)
        return Response({"detail": "Not liked"}, status=status.HTTP_400_BAD_REQUEST)


class ReplyLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        profile = getattr(request.user, "profile", request.user)
        reply = get_object_or_404(Reply, id=id)
        like, created = ReplyLike.objects.get_or_create(user=profile, reply=reply)
        if created:
            reply.likes_count += 1
            reply.save(update_fields=["likes_count"])
            return Response({"detail": "Reply liked"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already liked"}, status=status.HTTP_200_OK)


class ReplyUnlikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        profile = getattr(request.user, "profile", request.user)
        reply = get_object_or_404(Reply, id=id)
        deleted, _ = ReplyLike.objects.filter(user=profile, reply=reply).delete()
        if deleted:
            reply.likes_count = max(0, reply.likes_count - 1)
            reply.save(update_fields=["likes_count"])
            return Response({"detail": "Reply unliked"}, status=status.HTTP_200_OK)
        return Response({"detail": "Not liked"}, status=status.HTTP_400_BAD_REQUEST)


class MyPostsView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = self.request.user.profile
        return Post.objects.filter(author=profile).select_related("author__user").prefetch_related("hashtags").order_by("-created_at")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def repost_post(request, post_id):
    """
    Repost an existing post — duplicates content and image automatically.
    """
    try:
        original_post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    user_profile = request.user.profile

    # Prevent duplicate reposts by same user
    if Post.objects.filter(author=user_profile, original_post=original_post).exists():
        return Response({"error": "Already reposted this post."}, status=status.HTTP_400_BAD_REQUEST)

    # Create a new post with copied content and image
    repost = Post.objects.create(
        author=user_profile,
        content=original_post.content,
        image=original_post.image,
        original_post=original_post,
    )

    # Copy hashtags properly
    repost.hashtags.set(original_post.hashtags.all())

    # Increment repost count safely
    Post.objects.filter(id=original_post.id).update(
        reposts_count=models.F("reposts_count") + 1
    )

    # Return serialized repost
    # Re-fetch the repost with its original_post data
    repost = Post.objects.select_related("original_post", "original_post__author__user").get(id=repost.id)
    serializer = PostDetailSerializer(repost, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyRepostsView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = self.request.user.profile
        return Post.objects.filter(author=profile, original_post__isnull=False).order_by("-created_at")


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unrepost_post(request, post_id):
    """
    Remove a repost made by the authenticated user for the given post.
    """
    user = request.user
    try:
        # Find the repost made by this user that points to the original post
        repost = Post.objects.get(author=user.profile, original_post__id=post_id)
    except Post.DoesNotExist:
        return Response({"detail": "You haven’t reposted this post."}, status=status.HTTP_404_NOT_FOUND)

    original_post = repost.original_post
    repost.delete()

    # Decrement repost count safely
    if original_post:
        original_post.reposts_count = max(0, original_post.reposts_count - 1)
        original_post.save(update_fields=["reposts_count"])

    return Response({"detail": "Repost removed successfully."}, status=status.HTTP_204_NO_CONTENT)