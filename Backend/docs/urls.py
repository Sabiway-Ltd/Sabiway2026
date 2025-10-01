# docs/urls.py
from django.urls import path
from .views import (AuthDocsView, ProfilesDocsView, AuthAdminDocsView, ProfilesAdminDocsView, 
                    PostsDocsView, PostsAdminDocsView, NotificationsDocsView, SearchDocsView)

urlpatterns = [
    path("auth/", AuthDocsView.as_view(), name="api-auth-docs"),
    path("auth-admin/", AuthAdminDocsView.as_view(), name="api-auth-admin-docs"),
    path("profiles/", ProfilesDocsView.as_view(), name="api-profile-docs"),
    path("profiles-admin/", ProfilesAdminDocsView.as_view(), name="api-profile-admin-docs"),
    path("posts/", PostsDocsView.as_view(), name="api-posts-docs"),
    path("posts-admin/", PostsAdminDocsView.as_view(), name="api-posts-admin-docs"),
    path("notifications/", NotificationsDocsView.as_view(), name="api-notifications-docs"),
    path("search/", SearchDocsView.as_view(), name="api-search-docs"),
]
