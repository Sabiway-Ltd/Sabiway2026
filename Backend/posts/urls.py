from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BookmarkPostView, CommentLikeToggleView, CommentUnlikeToggleView,
    CommentViewSet, HashtagViewSet, LikeViewSet, ModerationReportActionView,
    ModerationReportListView, MyBookmarksView, MyPostsView, MyRepostsView,
    PostViewSet, ReplyLikeToggleView, ReplyUnlikeToggleView, ReplyViewSet,
    ReportPostView, TrendingHashtagsView, UnbookmarkPostView, repost_post,
    unrepost_post,
)

router = DefaultRouter()
router.register(r"hashtags", HashtagViewSet, basename="hashtag")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"replies", ReplyViewSet, basename="reply")
router.register(r"likes", LikeViewSet, basename="like")
router.register(r"", PostViewSet, basename="post")

urlpatterns = [
    path("moderation/reports/", ModerationReportListView.as_view(), name="moderation-reports"),
    path("moderation/reports/<int:report_id>/action/", ModerationReportActionView.as_view(), name="moderation-report-action"),
    path("report/", ReportPostView.as_view(), name="report-post"),
    path("<uuid:post_id>/repost/", repost_post, name="repost-post"),
    path("<uuid:post_id>/unrepost/", unrepost_post, name="unrepost-post"),
    path("<uuid:id>/bookmark/", BookmarkPostView.as_view(), name="bookmark-post"),
    path("<uuid:id>/unbookmark/", UnbookmarkPostView.as_view(), name="unbookmark-post"),
    path("me/bookmarks/", MyBookmarksView.as_view(), name="my-bookmarks"),
    path("me/reposts/", MyRepostsView.as_view(), name="my-reposts"),
    path("me/", MyPostsView.as_view(), name="my-posts"),
    path("hashtags/trending/", TrendingHashtagsView.as_view(), name="trending-hashtags"),
    path("comments/<uuid:id>/like/", CommentLikeToggleView.as_view(), name="comment-like"),
    path("comments/<uuid:id>/unlike/", CommentUnlikeToggleView.as_view(), name="comment-unlike"),
    path("replies/<uuid:id>/like/", ReplyLikeToggleView.as_view(), name="reply-like"),
    path("replies/<uuid:id>/unlike/", ReplyUnlikeToggleView.as_view(), name="reply-unlike"),
    path("replies/<uuid:parent_reply>/children/", ReplyViewSet.as_view({"get": "list"}), name="reply-children"),
    path("", include(router.urls)),
]
