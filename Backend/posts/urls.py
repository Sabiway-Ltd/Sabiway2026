# posts/urls.py

from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import PostViewSet, CommentViewSet, ReplyViewSet, HashtagViewSet

router = DefaultRouter()
router.register(r"hashtags", HashtagViewSet, basename="hashtag")  # put first
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"replies", ReplyViewSet, basename="reply")
router.register(r"", PostViewSet, basename="post")  # keep last


urlpatterns = [
    path("", include(router.urls)),
]

from django.urls import path
from .views import BookmarkPostView, UnbookmarkPostView, MyBookmarksView

urlpatterns = [
    path("posts/<int:id>/bookmark/", BookmarkPostView.as_view(), name="bookmark-post"),
    path("posts/<int:id>/unbookmark/", UnbookmarkPostView.as_view(), name="unbookmark-post"),
    path("me/bookmarks/", MyBookmarksView.as_view(), name="my-bookmarks"),
]
