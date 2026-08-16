import uuid

from django.db import models
from django.db.models import Case, Count, F, IntegerField, When
from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.email_utils import send_resend_email
from profiles.models import Follow, Profile
from sabiway.settings import ADMIN_REPORT_EMAIL

from .models import (
    Bookmark,
    Comment,
    CommentLike,
    Hashtag,
    Like,
    Post,
    PostImpression,
    PostReport,
    Reply,
    ReplyLike,
)
from .pagination import PostPagination
from .permissions import IsLikeOwner, IsPostOwnerOrReadOnly, IsProfileOwnerOrReadOnly
from .realtime import broadcast_forum_event
from .serializers import (
    BookmarkSerializer,
    CommentSerializer,
    HashtagSerializer,
    LikeSerializer,
    PostCreateSerializer,
    PostDetailSerializer,
    PostListSerializer,
    PostReportSerializer,
    ReplySerializer,
)


class ImpressionTrackingMixin:
    def track_impressions(self, request, posts):
        profile = getattr(request.user, "profile", None)
        if not profile:
            return

        post_ids = [obj.id for obj in posts]
        if not post_ids:
            return

        existing_ids = set(
            PostImpression.objects.filter(user=profile, post_id__in=post_ids)
            .values_list("post_id", flat=True)
        )
        new_post_ids = set(post_ids) - existing_ids
        if not new_post_ids:
            return

        PostImpression.objects.bulk_create(
            [PostImpression(post_id=post_id, user=profile) for post_id in new_post_ids],
            ignore_conflicts=True,
        )
        Post.objects.filter(id__in=new_post_ids).update(
            impressions_count=F("impressions_count") + 1
        )


class HashtagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hashtag.objects.all().order_by("-use_count")
    serializer_class = HashtagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class PostViewSet(ImpressionTrackingMixin, viewsets.ModelViewSet):
    queryset = Post.objects.select_related("author__user").prefetch_related("hashtags").all()
    permission_classes = [IsAuthenticatedOrReadOnly, IsPostOwnerOrReadOnly]
    pagination_class = PostPagination

    def get_serializer_class(self):
        if self.action == "create":
            return PostCreateSerializer
        if self.action in {"retrieve", "update", "partial_update"}:
            return PostDetailSerializer
        return PostListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.is_authenticated and hasattr(user, "profile"):
            profile = user.profile
            following_ids = Follow.objects.filter(follower=profile).values_list("following_id", flat=True)
            follower_ids = Follow.objects.filter(following=profile).values_list("follower_id", flat=True)
            related_ids = set(following_ids) | set(follower_ids)
            return qs.annotate(
                rank=Case(
                    When(author=profile, then=0),
                    When(author__in=related_ids, then=0),
                    default=1,
                    output_field=IntegerField(),
                )
            ).order_by("rank", "-created_at")

        return qs.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        post_data = PostDetailSerializer(post, context={"request": request}).data
        broadcast_forum_event({"action": "create", "post": post_data})
        return Response(post_data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        post_data = PostDetailSerializer(post, context={"request": request}).data
        broadcast_forum_event({"action": "update", "post": post_data})
        return Response(post_data, status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        post_id = str(instance.id)
        author_profile = instance.author
        author_profile.posts_count = max(0, author_profile.posts_count - 1)
        author_profile.save(update_fields=["posts_count"])

        for tag in instance.hashtags.all():
            if tag.use_count > 0:
                tag.use_count -= 1
                tag.save(update_fields=["use_count"])

        instance.delete()
        broadcast_forum_event({"action": "delete", "post_id": post_id})

    @action(detail=True, methods=["post"], url_path="like")
    def like(self, request, pk=None):
        post = self.get_object()
        profile = request.user.profile
        _, created = Like.objects.get_or_create(user=profile, post=post)
        if created:
            post.likes_count += 1
            post.save(update_fields=["likes_count"])
            return Response({"detail": "Liked"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already liked"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="unlike")
    def unlike(self, request, pk=None):
        post = self.get_object()
        profile = request.user.profile
        deleted, _ = Like.objects.filter(user=profile, post=post).delete()
        if deleted:
            post.likes_count = max(0, post.likes_count - 1)
            post.save(update_fields=["likes_count"])
            return Response({"detail": "Unliked"}, status=status.HTTP_200_OK)
        return Response({"detail": "Not liked"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "GET":
            qs = (
                post.comments.select_related("user__user")
                .annotate(reply_count=Count("replies"))
                .order_by("-created_at")
            )
            return Response(CommentSerializer(qs, many=True, context={"request": request}).data)

        data = request.data.copy()
        data["post"] = str(post.id)
        serializer = CommentSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        return Response(
            CommentSerializer(comment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="replies")
    def list_replies(self, request, pk=None):
        post = self.get_object()
        replies = Reply.objects.filter(comment__post=post).select_related("user__user")
        return Response(ReplySerializer(replies, many=True, context={"request": request}).data)

    @action(detail=False, methods=["get"], url_path=r"user/(?P<username>[\w.@+-]+)")
    def user_posts(self, request, username=None):
        username = username[1:] if username and username.startswith("@") else username
        profile = get_object_or_404(Profile, username=f"@{username}")
        posts = (
            Post.objects.filter(author=profile)
            .select_related("author__user")
            .prefetch_related("hashtags")
            .order_by("-created_at")
        )
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        results = response.data.get("results", response.data)
        post_ids = [item["id"] for item in results]
        self.track_impressions(request, Post.objects.filter(id__in=post_ids))
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        self.track_impressions(request, [self.get_object()])
        return response


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("user__user", "post").all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsProfileOwnerOrReadOnly]

    def perform_destroy(self, instance):
        post = instance.post
        post.comments_count = max(0, post.comments_count - 1)
        post.save(update_fields=["comments_count"])
        instance.delete()

    @action(detail=True, methods=["get"], url_path="replies")
    def get_replies(self, request, pk=None):
        comment = self.get_object()
        replies = comment.replies.select_related("user__user").all().order_by("created_at")
        return Response(ReplySerializer(replies, many=True, context={"request": request}).data)


class ReplyViewSet(viewsets.ModelViewSet):
    queryset = Reply.objects.select_related("user__user", "comment", "parent_reply").all()
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsProfileOwnerOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        parent_reply = self.kwargs.get("parent_reply")
        return qs.filter(parent_reply_id=parent_reply) if parent_reply else qs

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        parent_reply_id = data.get("parent_reply")
        if parent_reply_id and not data.get("comment"):
            parent_reply = get_object_or_404(Reply, id=parent_reply_id)
            data["comment"] = str(parent_reply.comment.id)
            data["parent_reply"] = str(parent_reply.id)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        reply = serializer.save()
        return Response(
            self.get_serializer(reply).data,
            status=status.HTTP_201_CREATED,
        )


class LikeViewSet(viewsets.ModelViewSet):
    queryset = Like.objects.select_related("user__user", "post").all()
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated, IsLikeOwner]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        return super().get_queryset().filter(user=profile) if profile else super().get_queryset().none()

    def create(self, request, *args, **kwargs):
        post_id = request.data.get("post")
        post = get_object_or_404(Post, id=post_id)
        profile = request.user.profile
        like, created = Like.objects.get_or_create(user=profile, post=post)
        if not created:
            raise serializers.ValidationError({"detail": "Already liked"})
        post.likes_count += 1
        post.save(update_fields=["likes_count"])
        return Response(self.get_serializer(like).data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        post = instance.post
        instance.delete()
        post.likes_count = max(0, post.likes_count - 1)
        post.save(update_fields=["likes_count"])


class BookmarkPostView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    def post(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=kwargs.get("id") or kwargs.get("pk"))
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
        if not created:
            return Response({"detail": "Already bookmarked"}, status=status.HTTP_200_OK)
        return Response(
            BookmarkSerializer(bookmark, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class UnbookmarkPostView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=kwargs.get("id") or kwargs.get("pk"))
        deleted, _ = Bookmark.objects.filter(user=request.user, post=post).delete()
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Not bookmarked"}, status=status.HTTP_400_BAD_REQUEST)


class MyBookmarksView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer
    pagination_class = PostPagination

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).select_related("post").order_by("-created_at")


class TrendingHashtagsView(generics.ListAPIView):
    serializer_class = HashtagSerializer

    def get_queryset(self):
        return Hashtag.objects.order_by("-use_count")[:10]


class CommentLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        comment = get_object_or_404(Comment, id=id)
        _, created = CommentLike.objects.get_or_create(user=request.user.profile, comment=comment)
        if created:
            comment.likes_count += 1
            comment.save(update_fields=["likes_count"])
            return Response({"detail": "Comment liked"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already liked"}, status=status.HTTP_200_OK)


class CommentUnlikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        comment = get_object_or_404(Comment, id=id)
        deleted, _ = CommentLike.objects.filter(user=request.user.profile, comment=comment).delete()
        if deleted:
            comment.likes_count = max(0, comment.likes_count - 1)
            comment.save(update_fields=["likes_count"])
            return Response({"detail": "Comment unliked"}, status=status.HTTP_200_OK)
        return Response({"detail": "Not liked"}, status=status.HTTP_400_BAD_REQUEST)


class ReplyLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        reply = get_object_or_404(Reply, id=id)
        _, created = ReplyLike.objects.get_or_create(user=request.user.profile, reply=reply)
        if created:
            reply.likes_count += 1
            reply.save(update_fields=["likes_count"])
            return Response({"detail": "Reply liked"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already liked"}, status=status.HTTP_200_OK)


class ReplyUnlikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        reply = get_object_or_404(Reply, id=id)
        deleted, _ = ReplyLike.objects.filter(user=request.user.profile, reply=reply).delete()
        if deleted:
            reply.likes_count = max(0, reply.likes_count - 1)
            reply.save(update_fields=["likes_count"])
            return Response({"detail": "Reply unliked"}, status=status.HTTP_200_OK)
        return Response({"detail": "Not liked"}, status=status.HTTP_400_BAD_REQUEST)


class MyPostsView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PostPagination

    def get_queryset(self):
        return (
            Post.objects.filter(author=self.request.user.profile)
            .select_related("author__user")
            .prefetch_related("hashtags")
            .order_by("-created_at")
        )


def _json_safe(value):
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, uuid.UUID):
        return str(value)
    return value


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def repost_post(request, post_id):
    original_post = get_object_or_404(Post, id=post_id)
    user_profile = request.user.profile

    if Post.objects.filter(author=user_profile, original_post=original_post).exists():
        return Response({"error": "Already reposted this post."}, status=status.HTTP_400_BAD_REQUEST)

    repost = Post.objects.create(
        author=user_profile,
        content=original_post.content,
        image=original_post.image,
        original_post=original_post,
    )
    repost.hashtags.set(original_post.hashtags.all())
    Post.objects.filter(id=original_post.id).update(reposts_count=F("reposts_count") + 1)

    repost = Post.objects.select_related(
        "author__user", "original_post", "original_post__author__user"
    ).get(id=repost.id)
    repost_data = PostDetailSerializer(repost, context={"request": request}).data
    broadcast_forum_event(
        {
            "action": "repost",
            "post": _json_safe(repost_data),
            "repost_id": str(repost.id),
            "original_post_id": str(original_post.id),
        }
    )
    return Response(repost_data, status=status.HTTP_201_CREATED)


class MyRepostsView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(
            author=self.request.user.profile,
            original_post__isnull=False,
        ).order_by("-created_at")


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unrepost_post(request, post_id):
    repost = get_object_or_404(
        Post,
        author=request.user.profile,
        original_post__id=post_id,
    )
    original_post = repost.original_post
    repost_id = str(repost.id)
    repost.delete()

    if original_post:
        original_post.reposts_count = max(0, original_post.reposts_count - 1)
        original_post.save(update_fields=["reposts_count"])

    broadcast_forum_event(
        {
            "action": "unrepost",
            "repost_id": repost_id,
            "original_post_id": str(post_id),
        }
    )
    return Response(status=status.HTTP_204_NO_CONTENT)


class ReportPostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PostReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = get_object_or_404(Post, id=serializer.validated_data["post_id"])
        reason = serializer.validated_data["reason"]
        post_url = serializer.validated_data["post_url"]

        PostReport.objects.create(
            post=post,
            reported_by=request.user,
            reason=reason,
            post_url=post_url,
        )

        email_body = f"""
        <div style="font-family:Arial,sans-serif">
          <h2>A Post Has Been Reported</h2>
          <p><strong>Post ID:</strong> {post.id}</p>
          <p><strong>Post Author:</strong> {post.author.username}</p>
          <p><strong>Reported By:</strong> {request.user.email}</p>
          <p><strong>Reason:</strong> {reason}</p>
          <p><a href="{post_url}">View reported post</a></p>
        </div>
        """
        send_resend_email(ADMIN_REPORT_EMAIL, "A Post Has Been Reported", email_body)
        return Response({"message": "Post reported successfully"}, status=status.HTTP_201_CREATED)
