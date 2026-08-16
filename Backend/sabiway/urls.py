# sabiway/urls.py

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", include("health.urls")),
    path("api/auth/", include("accounts.urls")),
    path("docs/", include("docs.urls")),
    path("api/profiles/", include("profiles.urls")),
    path("api/posts/", include("posts.urls")),
    path("api/search/", include("search.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/marketplace/", include("marketplace.urls")),
    path("api/verification/", include("verification.urls")),
    path("api/sabipay/", include("sabipay.urls")),
    path("api/trust/", include("trustops.urls")),
]
