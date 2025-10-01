# profiles/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProfileViewSet, ProfileDetailView, TopContributorsView

router = DefaultRouter()
router.register(r'', ProfileViewSet, basename='profile')

urlpatterns = [
    path("me/", ProfileDetailView.as_view(), name="profile-detail"),
    path("contributors/top/", TopContributorsView.as_view(), name="top-contributors"),
    path('', include(router.urls)),
]