# profiles/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProfileViewSet, ProfileDetailView, TopContributorsView, MyFollowersView, MyFollowingView
from .public_views import PublicMarketplaceProfileView

router = DefaultRouter()
router.register(r'', ProfileViewSet, basename='profile')

urlpatterns = [
    path("public/<str:username>/", PublicMarketplaceProfileView.as_view(), name="public-marketplace-profile"),
    path("me/", ProfileDetailView.as_view(), name="profile-detail"),
    path("contributors/top/", TopContributorsView.as_view(), name="top-contributors"),
    path("me/followers/", MyFollowersView.as_view(), name="my-followers"),
    path("me/following/", MyFollowingView.as_view(), name="my-following"),
    path('', include(router.urls)),
]