# posts/views.py

from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Post, Like, Comment, Reply, Hashtag
from .serializers import (
    PostListSerializer, PostCreateSerializer, PostDetailSerializer,
    LikeSerializer, CommentSerializer, ReplySerializer, HashtagSerializer
)


class HashtagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet to list and retrieve hashtags.
    """
    queryset = Hashtag.objects.all().order_by("-use_count")
    serializer_class = HashtagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.select_related("author__user").prefetch_related("hashtags").all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("create",):
            return PostCreateSerializer
        if self.action in ("retrieve",):
            return PostDetailSerializer
        return PostListSerializer

    def perform_destroy(self, instance):
        author_profile = instance.author
        # decrement posts_count
        author_profile.posts_count = max(0, author_profile.posts_count - 1)
        author_profile.save(update_fields=["posts_count"])
        # update hashtags use_count (decrement)
        for tag in instance.hashtags.all():
            if tag.use_count > 0:
                tag.use_count = tag.use_count - 1
                tag.save(update_fields=["use_count"])
        instance.delete()

    @action(detail=True, methods=["post"], url_path="like")
    def like(self, request, pk=None):
        post = self.get_object()
        profile = request.user.profile
        obj, created = Like.objects.get_or_create(user=profile, post=post)
        if created:
            post.likes_count = post.likes_count + 1
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

    @action(detail=True, methods=["get"], url_path="comments")
    def list_comments(self, request, pk=None):
        post = self.get_object()
        qs = post.comments.select_related("user__user").all()
        serializer = CommentSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="comments")
    def create_comment(self, request, pk=None):
        post = self.get_object()
        data = request.data.copy()
        data["post"] = str(post.id)  # serializer expects PK; serializers will accept UUID str
        serializer = CommentSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="replies")
    def list_replies(self, request, pk=None):
        post = self.get_object()
        # return all replies for all comments on the post (optional)
        replies = Reply.objects.filter(comment__post=post).select_related("user__user")
        serializer = ReplySerializer(replies, many=True)
        return Response(serializer.data)

    # you can also create reply via comment-level endpoint (see CommentViewSet below)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("user__user", "post").all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        post = instance.post
        if post.comments_count > 0:
            post.comments_count = max(0, post.comments_count - 1)
            post.save(update_fields=["comments_count"])
        instance.delete()


class ReplyViewSet(viewsets.ModelViewSet):
    queryset = Reply.objects.select_related("user__user", "comment__post").all()
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticated]








from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Post, Bookmark
from .serializers import BookmarkSerializer

class BookmarkPostView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    def post(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=kwargs["id"])
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
        if not created:
            return Response({"detail": "Already bookmarked"}, status=status.HTTP_200_OK)
        return Response(BookmarkSerializer(bookmark).data, status=status.HTTP_201_CREATED)


class UnbookmarkPostView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        post = get_object_or_404(Post, id=kwargs["id"])
        deleted, _ = Bookmark.objects.filter(user=request.user, post=post).delete()
        if deleted:
            return Response({"detail": "Unbookmarked"}, status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Not bookmarked"}, status=status.HTTP_400_BAD_REQUEST)


class MyBookmarksView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).select_related("post").order_by("-created_at")
