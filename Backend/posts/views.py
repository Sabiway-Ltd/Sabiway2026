# posts/views.py
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Post, Like, Comment, Reply, Hashtag, Bookmark, Repost
from .serializers import (
    PostListSerializer, PostCreateSerializer, PostDetailSerializer,
    LikeSerializer, CommentSerializer, ReplySerializer, HashtagSerializer, BookmarkSerializer,
    RepostSerializer
)


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
            qs = post.comments.select_related("user__user").all()
            serializer = CommentSerializer(qs, many=True, context={"request": request})
            return Response(serializer.data)

        if request.method == "POST":
            data = request.data.copy()
            data["post"] = str(post.id)
            serializer = CommentSerializer(data=data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            comment = serializer.save()
            return Response(CommentSerializer(comment, context={"request": request}).data, status=status.HTTP_201_CREATED)

    # ✅ Replies endpoint
    @action(detail=True, methods=["get"], url_path="replies")
    def list_replies(self, request, pk=None):
        post = self.get_object()
        replies = Reply.objects.filter(comment__post=post).select_related("user__user")
        serializer = ReplySerializer(replies, many=True, context={"request": request})
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
        user_obj = getattr(request.user, "profile", request.user)
        bookmark, created = Bookmark.objects.get_or_create(user=user_obj, post=post)
        if not created:
            return Response({"detail": "Already bookmarked"}, status=status.HTTP_200_OK)
        return Response(BookmarkSerializer(bookmark, context={"request": request}).data, status=status.HTTP_201_CREATED)


class UnbookmarkPostView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=kwargs.get("id") or kwargs.get("pk"))
        user_obj = getattr(request.user, "profile", request.user)
        deleted, _ = Bookmark.objects.filter(user=user_obj, post=post).delete()
        if deleted:
            return Response({"detail": "Unbookmarked"}, status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Not bookmarked"}, status=status.HTTP_400_BAD_REQUEST)


class MyBookmarksView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    def get_queryset(self):
        user_obj = getattr(self.request.user, "profile", self.request.user)
        return Bookmark.objects.filter(user=user_obj).select_related("post").order_by("-created_at")


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
