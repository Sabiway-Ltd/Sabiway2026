# docs/urls.py

from django.urls import path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from .views import (BaseDocsView, AuthDocsView, ProfilesDocsView, AuthAdminDocsView, ProfilesAdminDocsView, 
                    PostsDocsView, PostsAdminDocsView, NotificationsDocsView, SearchDocsView)


schema_view = get_schema_view(
    openapi.Info(
        title="SabiWay API Documentation",
        default_version="v1",
        description="Official API documentation for the SabiWay platform.",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="support@sabiway.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    authentication_classes=[],
)

# ✅ Add security definitions for JWT
schema_view.security_definitions = {
    "Bearer": {
        "type": "apiKey",
        "name": "Authorization",
        "in": "header",
        "description": "JWT Authorization header using the Bearer scheme. Example: 'Bearer your_token_here'",
    }
}

urlpatterns = [
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path("json/", schema_view.without_ui(cache_timeout=0), name="schema-json"),



    # For HTML docs
    path("", BaseDocsView.as_view(), name="api-base-docs"),
    path("auth/", AuthDocsView.as_view(), name="api-auth-docs"),
    path("auth-admin/", AuthAdminDocsView.as_view(), name="api-auth-admin-docs"),
    path("profiles/", ProfilesDocsView.as_view(), name="api-profile-docs"),
    path("profiles-admin/", ProfilesAdminDocsView.as_view(), name="api-profile-admin-docs"),
    path("posts/", PostsDocsView.as_view(), name="api-posts-docs"),
    path("posts-admin/", PostsAdminDocsView.as_view(), name="api-posts-admin-docs"),
    path("notifications/", NotificationsDocsView.as_view(), name="api-notifications-docs"),
    path("search/", SearchDocsView.as_view(), name="api-search-docs"),
]
