# posts/urls.py

from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import PostViewSet, CommentViewSet, ReplyViewSet

router = DefaultRouter()
router.register(r"", PostViewSet, basename="post")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"replies", ReplyViewSet, basename="reply")

urlpatterns = [
    path("", include(router.urls)),
]
