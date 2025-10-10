# posts/urls.py

from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    PostViewSet, CommentViewSet, ReplyViewSet, HashtagViewSet,
    BookmarkPostView, UnbookmarkPostView, MyBookmarksView, LikeViewSet,
    RepostView, UnrepostView, MyRepostsView, RepostViewSet, TrendingHashtagsView,
    CommentLikeToggleView, CommentUnlikeToggleView, ReplyLikeToggleView,
    ReplyUnlikeToggleView, MyPostsView,
)

router = DefaultRouter()
router.register(r"hashtags", HashtagViewSet, basename="hashtag")  # put first
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"replies", ReplyViewSet, basename="reply")
router.register(r"likes", LikeViewSet, basename="like")   # 👈 new
router.register(r"reposts", RepostViewSet, basename="repost")
router.register(r"", PostViewSet, basename="post")  # keep last

urlpatterns = [
    path("<uuid:id>/bookmark/", BookmarkPostView.as_view(), name="bookmark-post"),
    path("<uuid:id>/unbookmark/", UnbookmarkPostView.as_view(), name="unbookmark-post"),
    path("me/bookmarks/", MyBookmarksView.as_view(), name="my-bookmarks"),
    path("<uuid:id>/repost/", RepostView.as_view(), name="repost-post"),
    path("<uuid:id>/repost/<int:repost_id>/", UnrepostView.as_view(), name="unrepost-post"),
    path("me/reposts/", MyRepostsView.as_view(), name="my-reposts"),
    path("hashtags/trending/", TrendingHashtagsView.as_view(), name="trending-hashtags"),
        # Comment like/unlike
    path("comments/<uuid:id>/like/", CommentLikeToggleView.as_view(), name="comment-like"),
    path("comments/<uuid:id>/unlike/", CommentUnlikeToggleView.as_view(), name="comment-unlike"),

    # Reply like/unlike
    path("replies/<uuid:id>/like/", ReplyLikeToggleView.as_view(), name="reply-like"),
    path("replies/<uuid:id>/unlike/", ReplyUnlikeToggleView.as_view(), name="reply-unlike"),

    path("me/", MyPostsView.as_view(), name="my-posts"),


    path("", include(router.urls)),
]
