import uuid

from django.db import models, transaction
from django.db.models import Case, Count, F, IntegerField, Q, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.email_utils import send_resend_email
from profiles.models import Follow, Profile
from sabiway.settings import ADMIN_REPORT_EMAIL

from .models import (
    Bookmark, Comment, CommentLike, Hashtag, Like, ModerationAudit, Post,
    PostImpression, PostReport, Reply, ReplyLike,
)
from .pagination import PostPagination
from .permissions import IsLikeOwner, IsPostOwnerOrReadOnly, IsProfileOwnerOrReadOnly
from .realtime import broadcast_forum_event
from .serializers import (
    BookmarkSerializer, CommentSerializer, HashtagSerializer, LikeSerializer,
    PostCreateSerializer, PostDetailSerializer, PostListSerializer,
    PostReportSerializer, ReplySerializer,
)


def visible_posts_for(request):
    qs = Post.objects.select_related("author__user", "original_post").prefetch_related("hashtags")
    user = request.user
    if user.is_authenticated and user.is_staff:
        return qs
    visible = Q(is_hidden=False) & (Q(original_post__isnull=True) | Q(original_post__is_hidden=False))
    if user.is_authenticated and hasattr(user, "profile"):
        return qs.filter(visible | Q(author=user.profile))
    return qs.filter(visible)


class ImpressionTrackingMixin:
    def track_impressions(self, request, posts):
        profile = getattr(request.user, "profile", None)
        if not profile:
            return
        post_ids = [obj.id for obj in posts if not obj.is_hidden]
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
        Post.objects.filter(id__in=new_post_ids).update(impressions_count=F("impressions_count") + 1)


class HashtagViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HashtagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Hashtag.objects.filter(posts__is_hidden=False).distinct().order_by("-use_count")


class PostViewSet(ImpressionTrackingMixin, viewsets.ModelViewSet):
    queryset = Post.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly, IsPostOwnerOrReadOnly]
    pagination_class = PostPagination

    def get_serializer_class(self):
        if self.action == "create":
            return PostCreateSerializer
        if self.action in {"retrieve", "update", "partial_update"}:
            return PostDetailSerializer
        return PostListSerializer

    def get_queryset(self):
        qs = visible_posts_for(self.request)
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
        return Response(post_data)

    def perform_destroy(self, instance):
        post_id = str(instance.id)
        author = instance.author
        author.posts_count = max(0, author.posts_count - 1)
        author.save(update_fields=["posts_count"])
        for tag in instance.hashtags.all():
            if tag.use_count > 0:
                tag.use_count -= 1
                tag.save(update_fields=["use_count"])
        instance.delete()
        broadcast_forum_event({"action": "delete", "post_id": post_id})

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user.profile, post=post)
        if created:
            post.likes_count = F("likes_count") + 1
            post.save(update_fields=["likes_count"])
            return Response({"detail": "Liked"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already liked"})

    @action(detail=True, methods=["post"])
    def unlike(self, request, pk=None):
        post = self.get_object()
        deleted, _ = Like.objects.filter(user=request.user.profile, post=post).delete()
        if deleted:
            Post.objects.filter(pk=post.pk, likes_count__gt=0).update(likes_count=F("likes_count") - 1)
            return Response({"detail": "Unliked"})
        return Response({"detail": "Not liked"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "GET":
            qs = post.comments.select_related("user__user").annotate(reply_count=Count("replies")).order_by("-created_at")
            return Response(CommentSerializer(qs, many=True, context={"request": request}).data)
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        data = request.data.copy()
        data["post"] = str(post.id)
        serializer = CommentSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        return Response(CommentSerializer(comment, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="replies")
    def list_replies(self, request, pk=None):
        post = self.get_object()
        replies = Reply.objects.filter(comment__post=post).select_related("user__user")
        return Response(ReplySerializer(replies, many=True, context={"request": request}).data)

    @action(detail=False, methods=["get"], url_path=r"user/(?P<username>[\w.@+-]+)")
    def user_posts(self, request, username=None):
        username = username[1:] if username and username.startswith("@") else username
        profile = get_object_or_404(Profile, username=f"@{username}")
        posts = visible_posts_for(request).filter(author=profile).order_by("-created_at")
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        return paginator.get_paginated_response(PostListSerializer(page, many=True, context={"request": request}).data)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        results = response.data.get("results", response.data)
        self.track_impressions(request, Post.objects.filter(id__in=[item["id"] for item in results]))
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        self.track_impressions(request, [self.get_object()])
        return response


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("user__user", "post").all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsProfileOwnerOrReadOnly]

    def get_queryset(self):
        return super().get_queryset().filter(post__is_hidden=False)

    def perform_destroy(self, instance):
        post = instance.post
        instance.delete()
        Post.objects.filter(pk=post.pk, comments_count__gt=0).update(comments_count=F("comments_count") - 1)

    @action(detail=True, methods=["get"], url_path="replies")
    def get_replies(self, request, pk=None):
        comment = self.get_object()
        replies = comment.replies.select_related("user__user").order_by("created_at")
        return Response(ReplySerializer(replies, many=True, context={"request": request}).data)


class ReplyViewSet(viewsets.ModelViewSet):
    queryset = Reply.objects.select_related("user__user", "comment", "parent_reply").all()
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsProfileOwnerOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset().filter(comment__post__is_hidden=False)
        parent_reply = self.kwargs.get("parent_reply")
        return qs.filter(parent_reply_id=parent_reply) if parent_reply else qs

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        parent_reply_id = data.get("parent_reply")
        if parent_reply_id and not data.get("comment"):
            parent_reply = get_object_or_404(Reply, id=parent_reply_id, comment__post__is_hidden=False)
            data["comment"] = str(parent_reply.comment.id)
            data["parent_reply"] = str(parent_reply.id)
        serializer = self.get_serializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        reply = serializer.save()
        return Response(self.get_serializer(reply, context={"request": request}).data, status=status.HTTP_201_CREATED)


class LikeViewSet(viewsets.ModelViewSet):
    queryset = Like.objects.select_related("user__user", "post").all()
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated, IsLikeOwner]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        return super().get_queryset().filter(user=profile, post__is_hidden=False) if profile else super().get_queryset().none()

    def create(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=request.data.get("post"), is_hidden=False)
        like, created = Like.objects.get_or_create(user=request.user.profile, post=post)
        if not created:
            raise serializers.ValidationError({"detail": "Already liked"})
        Post.objects.filter(pk=post.pk).update(likes_count=F("likes_count") + 1)
        return Response(self.get_serializer(like).data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        post = instance.post
        instance.delete()
        Post.objects.filter(pk=post.pk, likes_count__gt=0).update(likes_count=F("likes_count") - 1)


class BookmarkPostView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    def post(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=kwargs.get("id") or kwargs.get("pk"), is_hidden=False)
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
        if not created:
            return Response({"detail": "Already bookmarked"})
        return Response(BookmarkSerializer(bookmark, context={"request": request}).data, status=status.HTTP_201_CREATED)


class UnbookmarkPostView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=kwargs.get("id") or kwargs.get("pk"))
        deleted, _ = Bookmark.objects.filter(user=request.user, post=post).delete()
        return Response(status=status.HTTP_204_NO_CONTENT) if deleted else Response({"detail": "Not bookmarked"}, status=status.HTTP_400_BAD_REQUEST)


class MyBookmarksView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer
    pagination_class = PostPagination

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user, post__is_hidden=False).select_related("post").order_by("-created_at")


class TrendingHashtagsView(generics.ListAPIView):
    serializer_class = HashtagSerializer

    def get_queryset(self):
        return Hashtag.objects.filter(posts__is_hidden=False).distinct().order_by("-use_count")[:10]


class CommentLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, id):
        comment = get_object_or_404(Comment, id=id, post__is_hidden=False)
        _, created = CommentLike.objects.get_or_create(user=request.user.profile, comment=comment)
        if created:
            Comment.objects.filter(pk=comment.pk).update(likes_count=F("likes_count") + 1)
            return Response({"detail": "Comment liked"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already liked"})


class CommentUnlikeToggleView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, id):
        comment = get_object_or_404(Comment, id=id)
        deleted, _ = CommentLike.objects.filter(user=request.user.profile, comment=comment).delete()
        if deleted:
            Comment.objects.filter(pk=comment.pk, likes_count__gt=0).update(likes_count=F("likes_count") - 1)
            return Response({"detail": "Comment unliked"})
        return Response({"detail": "Not liked"}, status=status.HTTP_400_BAD_REQUEST)


class ReplyLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, id):
        reply = get_object_or_404(Reply, id=id, comment__post__is_hidden=False)
        _, created = ReplyLike.objects.get_or_create(user=request.user.profile, reply=reply)
        if created:
            Reply.objects.filter(pk=reply.pk).update(likes_count=F("likes_count") + 1)
            return Response({"detail": "Reply liked"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already liked"})


class ReplyUnlikeToggleView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, id):
        reply = get_object_or_404(Reply, id=id)
        deleted, _ = ReplyLike.objects.filter(user=request.user.profile, reply=reply).delete()
        if deleted:
            Reply.objects.filter(pk=reply.pk, likes_count__gt=0).update(likes_count=F("likes_count") - 1)
            return Response({"detail": "Reply unliked"})
        return Response({"detail": "Not liked"}, status=status.HTTP_400_BAD_REQUEST)


class MyPostsView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PostPagination
    def get_queryset(self):
        return Post.objects.filter(author=self.request.user.profile).select_related("author__user").prefetch_related("hashtags").order_by("-created_at")


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
    original_post = get_object_or_404(Post, id=post_id, is_hidden=False)
    user_profile = request.user.profile
    if Post.objects.filter(author=user_profile, original_post=original_post).exists():
        return Response({"error": "Already reposted this post."}, status=status.HTTP_400_BAD_REQUEST)
    repost = Post.objects.create(author=user_profile, content=original_post.content, image=original_post.image, original_post=original_post)
    repost.hashtags.set(original_post.hashtags.all())
    Post.objects.filter(id=original_post.id).update(reposts_count=F("reposts_count") + 1)
    repost = Post.objects.select_related("author__user", "original_post", "original_post__author__user").get(id=repost.id)
    repost_data = PostDetailSerializer(repost, context={"request": request}).data
    broadcast_forum_event({"action": "repost", "post": _json_safe(repost_data), "repost_id": str(repost.id), "original_post_id": str(original_post.id)})
    return Response(repost_data, status=status.HTTP_201_CREATED)


class MyRepostsView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Post.objects.filter(author=self.request.user.profile, original_post__isnull=False, original_post__is_hidden=False).order_by("-created_at")


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unrepost_post(request, post_id):
    repost = get_object_or_404(Post, author=request.user.profile, original_post__id=post_id)
    original_post = repost.original_post
    repost_id = str(repost.id)
    repost.delete()
    if original_post:
        Post.objects.filter(pk=original_post.pk, reposts_count__gt=0).update(reposts_count=F("reposts_count") - 1)
    broadcast_forum_event({"action": "unrepost", "repost_id": repost_id, "original_post_id": str(post_id)})
    return Response(status=status.HTTP_204_NO_CONTENT)


class ReportPostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PostReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = get_object_or_404(Post, id=serializer.validated_data["post_id"], is_hidden=False)
        with transaction.atomic():
            report = PostReport.objects.create(
                post=post,
                reported_by=request.user,
                reason=serializer.validated_data["reason"],
                post_url=serializer.validated_data["post_url"],
            )
            ModerationAudit.objects.create(report=report, post=post, actor=request.user, action=ModerationAudit.Action.REPORTED, note=report.reason)
        email_body = f"<h2>A Post Has Been Reported</h2><p>Post ID: {post.id}</p><p>Reported By: {request.user.email}</p><p>Reason: {report.reason}</p>"
        send_resend_email(ADMIN_REPORT_EMAIL, "A Post Has Been Reported", email_body)
        return Response({"message": "Post reported successfully", "report_id": report.id}, status=status.HTTP_201_CREATED)


class ModerationReportListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        reports = PostReport.objects.select_related("post", "reported_by", "reviewed_by").order_by("-created_at")[:100]
        return Response([
            {
                "id": report.id,
                "post_id": str(report.post_id),
                "reason": report.reason,
                "status": report.status,
                "reported_by": report.reported_by.email if report.reported_by else None,
                "reviewed_by": report.reviewed_by.email if report.reviewed_by else None,
                "resolution_note": report.resolution_note,
                "created_at": report.created_at,
                "reviewed_at": report.reviewed_at,
            }
            for report in reports
        ])


class ModerationReportActionView(APIView):
    permission_classes = [IsAdminUser]
    allowed_actions = {"dismiss", "remove", "restore"}

    def post(self, request, report_id):
        requested_action = request.data.get("action")
        note = str(request.data.get("note", "")).strip()
        if requested_action not in self.allowed_actions:
            return Response({"detail": "action must be dismiss, remove or restore"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            report = get_object_or_404(PostReport.objects.select_for_update().select_related("post"), id=report_id)
            post = report.post
            if requested_action == "dismiss":
                report.status = PostReport.Status.DISMISSED
                audit_action = ModerationAudit.Action.DISMISSED
            elif requested_action == "remove":
                post.is_hidden = True
                post.moderation_reason = note or report.reason
                post.save(update_fields=["is_hidden", "moderation_reason", "updated_at"])
                report.status = PostReport.Status.REMOVED
                audit_action = ModerationAudit.Action.REMOVED
            else:
                post.is_hidden = False
                post.moderation_reason = ""
                post.save(update_fields=["is_hidden", "moderation_reason", "updated_at"])
                report.status = PostReport.Status.RESTORED
                audit_action = ModerationAudit.Action.RESTORED

            report.reviewed_by = request.user
            report.reviewed_at = timezone.now()
            report.resolution_note = note
            report.save(update_fields=["status", "reviewed_by", "reviewed_at", "resolution_note"])
            ModerationAudit.objects.create(report=report, post=post, actor=request.user, action=audit_action, note=note)

        if requested_action == "remove":
            broadcast_forum_event({"action": "delete", "post_id": str(post.id)})
        elif requested_action == "restore":
            post_data = PostDetailSerializer(post, context={"request": request}).data
            broadcast_forum_event({"action": "create", "post": post_data})

        return Response({"id": report.id, "status": report.status, "post_hidden": post.is_hidden})
