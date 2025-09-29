# docs/urls.py
from django.urls import path
from .views import AuthDocsView, ProfilesDocsView, AuthAdminDocsView, ProfilesAdminDocsView

urlpatterns = [
    path("auth/", AuthDocsView.as_view(), name="api-auth-docs"),
    path("auth-admin/", AuthAdminDocsView.as_view(), name="api-auth-admin-docs"),
    path("profiles/", ProfilesDocsView.as_view(), name="api-profile-docs"),
    path("profiles-admin/", ProfilesAdminDocsView.as_view(), name="api-profile-admin-docs"),
]
