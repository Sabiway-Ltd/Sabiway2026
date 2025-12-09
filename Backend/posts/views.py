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
from sabiway.settings import EXPRESS_URL
import requests
from rest_framework import status
import uuid

from .models import Post, PostReport
from .serializers import PostReportSerializer
from accounts.email_utils import send_resend_email
from sabiway.settings import ADMIN_REPORT_EMAIL

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

            # Get following + followers
            following_ids = Follow.objects.filter(
                follower=profile
            ).values_list("following_id", flat=True)

            follower_ids = Follow.objects.filter(
                following=profile
            ).values_list("follower_id", flat=True)

            related_ids = set(following_ids) | set(follower_ids)

            # First group (rank 0): my posts + related users posts
            # Second group (rank 1): everyone else
            qs = qs.annotate(
                rank=Case(
                    When(author=profile, then=0),
                    When(author__in=related_ids, then=0),
                    default=1,
                    output_field=IntegerField(),
                )
            ).order_by("rank", "-created_at")

            return qs

        # Unauthenticated users → global feed
        return qs.order_by("-created_at")



    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 1️⃣ Save the post
        post = serializer.save()

        # 2️⃣ Serialize the post fully (optional but recommended)
        full_serializer = PostDetailSerializer(post, context={"request": request})
        post_data = full_serializer.data

        # 3️⃣ Notify your Socket.io server ⬇️
        try:
            requests.post(
                f"{EXPRESS_URL}/broadcast",
                json={"action": "create", "post": post_data},
                timeout=2
            )
            print("Post Creation Real-time done")
        except Exception as e:
            print("⚠️ Real-time broadcast failed:", str(e))

        # 4️⃣ Return the response to the client
        return Response(post_data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        full_serializer = PostDetailSerializer(post, context={"request": request})
        post_data = full_serializer.data

        # Real-time broadcast
        try:
            requests.post(
                f"{EXPRESS_URL}/broadcast",
                json={"action": "update", "post": post_data},
                timeout=2
            )
        except Exception as e:
            print("⚠️ Real-time update broadcast failed:", str(e))

        return Response(post_data, status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        post_id = str(instance.id)  # keep ID for broadcast

        author_profile = instance.author
        author_profile.posts_count = max(0, author_profile.posts_count - 1)
        author_profile.save(update_fields=["posts_count"])

        for tag in instance.hashtags.all():
            if tag.use_count > 0:
                tag.use_count -= 1
                tag.save(update_fields=["use_count"])

        instance.delete()

        # Real-time broadcast
        try:
            requests.post(
                f"{EXPRESS_URL}/broadcast",
                json={"action": "delete", "post_id": post_id},
                timeout=2
            )
            print("Broadcasting delete:", post_id)
        except Exception as e:
            print("⚠️ Real-time delete broadcast failed:", str(e))
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
    pagination_class = PostPagination

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
    pagination_class = PostPagination

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

    # Create repost
    repost = Post.objects.create(
        author=user_profile,
        content=original_post.content,
        image=original_post.image,
        original_post=original_post,
    )

    repost.hashtags.set(original_post.hashtags.all())

    # Increment repost count safely
    Post.objects.filter(id=original_post.id).update(
        reposts_count=models.F("reposts_count") + 1
    )

    # Re-fetch with relations for clean serialization
    repost = Post.objects.select_related(
        "author__user",
        "original_post",
        "original_post__author__user"
    ).get(id=repost.id)

    serializer = PostDetailSerializer(repost, context={"request": request})
    repost_data = serializer.data

    # 🔹 Helper function to convert all UUIDs to strings
    def convert_uuids_to_str(obj):
        if isinstance(obj, dict):
            return {k: convert_uuids_to_str(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_uuids_to_str(i) for i in obj]
        elif isinstance(obj, uuid.UUID):
            return str(obj)
        return obj

    repost_data_safe = convert_uuids_to_str(repost_data)

    # ✅ Real-time broadcast
    try:
        requests.post(
            f"{EXPRESS_URL}/broadcast",
            json={
                "action": "repost",
                "post": repost_data_safe,
                "repost_id": str(repost.id),
                "original_post_id": str(original_post.id)
            },
            timeout=2
        )
    except Exception as e:
        print("⚠️ Real-time repost broadcast failed:", str(e))
        print("Repost ID:", repost.id)
        print("Original Post ID:", original_post.id)

    return Response(repost_data, status=status.HTTP_201_CREATED)


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
        repost = Post.objects.get(author=user.profile, original_post__id=post_id)
    except Post.DoesNotExist:
        return Response({"detail": "You haven’t reposted this post."}, status=status.HTTP_404_NOT_FOUND)

    original_post = repost.original_post
    repost_id = str(repost.id)

    repost.delete()

    # Decrement repost count safely
    if original_post:
        original_post.reposts_count = max(0, original_post.reposts_count - 1)
        original_post.save(update_fields=["reposts_count"])

    # ✅ ✅ ✅ REAL-TIME BROADCAST ✅ ✅ ✅
    try:
        requests.post(
            f"{EXPRESS_URL}/broadcast",
            json={
                "action": "unrepost",
                "repost_id": repost_id,
                "original_post_id": str(post_id)
            },
            timeout=2
        )
    except Exception as e:
        print("⚠️ Real-time unrepost broadcast failed:", str(e))

    return Response({"detail": "Repost removed successfully."}, status=status.HTTP_204_NO_CONTENT)


class ReportPostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PostReportSerializer(data=request.data)

        if not serializer.is_valid():
            # Print debug info for failed validation
            print("Report POST failed validation!")
            print("Request data:", request.data)
            print("Serializer errors:", serializer.errors)
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Serializer is valid
        post_id = serializer.validated_data["post_id"]
        reason = serializer.validated_data["reason"]
        post_url = serializer.validated_data["post_url"]

        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            print(f"Post with id {post_id} does not exist!")
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

        # Save report
        report = PostReport.objects.create(
            post=post,
            reported_by=request.user,
            reason=reason,
            post_url=post_url,
        )

        # Email admins
        email_body = f"""
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 40px 0; text-align: center;">
        <div style="background-color: #ffffff; width: 90%; max-width: 520px; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <!-- Header with Logo -->
            <div style="background-color: #008753; padding: 25px 0;">
            <img src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764563759/Group_3_2_1_buoqkz_vkpakj.png" 
                alt="SabiWay Logo" width="140" height="auto" style="display:block; margin:auto;">
            </div>

            <!-- Main Content -->
            <div style="padding: 30px; text-align:left;">
            <h2 style="color: #333333; margin-top: 0;">🚨 A Post Has Been Reported</h2>
            <p style="font-size: 16px; color: #555555; line-height: 1.6;">
                A user has reported a post on the platform. Please review the details below:
            </p>

            <p><strong>Post ID:</strong> {post.id}</p>
            <p><strong>Post Author:</strong> {post.author.username}</p>
            <p><strong>Reported By:</strong> {request.user.email}</p>
            <p><strong>Reason:</strong></p>
            <p style="padding: 10px; background:#f9fafb; border-radius:6px; color:#333;">{reason}</p>

            <div style="text-align:center; margin: 20px 0;">
                <a href="{post_url}" style="display:inline-block; background-color:#d9534f; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-weight:bold; font-size:16px;">
                View Reported Post
                </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <!-- Footer -->
            <p style="font-size: 14px; color: #888888; line-height: 1.5;">
                Cheers,<br>
                <strong style="color: #008753;">The SabiWay Team</strong>
            </p>
            </div>
        </div>
        </div>
        """

        send_resend_email(ADMIN_REPORT_EMAIL, "🚨 A Post Has Been Reported", email_body)


        print(f"Report successfully created: Post ID {post.id} by {request.user.email}")

        return Response(
            {"message": "Post reported successfully"},
            status=status.HTTP_201_CREATED,
        )
