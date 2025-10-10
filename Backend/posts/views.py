# posts/views.py
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Post, Like, Comment, Reply, Hashtag, Bookmark, Repost, CommentLike, ReplyLike 
from .serializers import (
    PostListSerializer, PostCreateSerializer, PostDetailSerializer,
    LikeSerializer, CommentSerializer, ReplySerializer, HashtagSerializer, BookmarkSerializer,
    RepostSerializer
)
from django.db.models import Count
from .models import PostImpression
from django.db import models


class HashtagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hashtag.objects.all().order_by("-use_count")
    serializer_class = HashtagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.select_related("author__user").prefetch_related("hashtags").all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == "create":
            return PostCreateSerializer
        if self.action == "retrieve":
            return PostDetailSerializer
        return PostListSerializer

    def perform_destroy(self, instance):
        # Decrement author's post count
        author_profile = instance.author
        author_profile.posts_count = max(0, author_profile.posts_count - 1)
        author_profile.save(update_fields=["posts_count"])

        # Decrement hashtags usage
        for tag in instance.hashtags.all():
            if tag.use_count > 0:
                tag.use_count -= 1
                tag.save(update_fields=["use_count"])
        instance.delete()

    # ✅ Like a post
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

    # ✅ Unlike a post
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

    # ✅ Comments endpoint (GET + POST combined)
    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        post = self.get_object()

        if request.method == "GET":
            qs = (
                post.comments
                .select_related("user__user")
                .annotate(reply_count=Count("replies"))  # ✅ Add reply count
                .order_by("-created_at")
            )
            serializer = CommentSerializer(qs, many=True, context={"request": request})
            return Response(serializer.data)

        if request.method == "POST":
            data = request.data.copy()
            data["post"] = str(post.id)
            serializer = CommentSerializer(data=data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            comment = serializer.save()
            return Response(
                CommentSerializer(comment, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        
    # ✅ Replies endpoint
    @action(detail=True, methods=["get"], url_path="replies")
    def list_replies(self, request, pk=None):
        post = self.get_object()
        replies = Reply.objects.filter(comment__post=post).select_related("user__user")
        serializer = ReplySerializer(replies, many=True, context={"request": request})
        return Response(serializer.data)
    

    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user_profile = getattr(request.user, "profile", None)

        if user_profile:
            # Create a unique impression for this user
            obj, created = PostImpression.objects.get_or_create(post=instance, user=user_profile)
            if created:
                # Only increment if a new impression
                instance.impressions_count = models.F('impressions_count') + 1
                instance.save(update_fields=['impressions_count'])
                instance.refresh_from_db()  # updated value

        serializer = self.get_serializer(instance)
        return Response(serializer.data)



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
    queryset = Reply.objects.select_related("user__user", "comment__post").all()
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticated]


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

class RepostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        profile = getattr(request.user, "profile", request.user)
        post = get_object_or_404(Post, id=id)
        message = request.data.get("message", None)

        repost, created = Repost.objects.get_or_create(user=profile, post=post)
        if not created:
            return Response({"detail": "Already reposted"}, status=status.HTTP_400_BAD_REQUEST)

        if message:
            repost.message = message
            repost.save(update_fields=["message"])

        post.reposts_count += 1
        post.save(update_fields=["reposts_count"])

        serializer = RepostSerializer(repost, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UnrepostView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, id, repost_id):
        profile = getattr(request.user, "profile", request.user)
        repost = get_object_or_404(Repost, id=repost_id, user=profile, post_id=id)
        post = repost.post
        repost.delete()

        post.reposts_count = max(0, post.reposts_count - 1)
        post.save(update_fields=["reposts_count"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyRepostsView(generics.ListAPIView):
    serializer_class = RepostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_obj = getattr(self.request.user, "profile", self.request.user)
        return Repost.objects.filter(user=user_obj).order_by("-created_at")


class RepostViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Repost.objects.select_related("user__user", "post__author__user").all().order_by("-created_at")
    serializer_class = RepostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


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
