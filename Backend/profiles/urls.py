# profiles/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProfileViewSet, ProfileDetailView

router = DefaultRouter()
router.register(r'', ProfileViewSet, basename='profile')

urlpatterns = [
    path("me/", ProfileDetailView.as_view(), name="profile-detail"),
    path('', include(router.urls)),
]