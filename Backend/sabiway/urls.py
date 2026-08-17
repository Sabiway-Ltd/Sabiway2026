# sabiway/urls.py

from django.contrib import admin
from django.urls import include, path

# Legacy /api/* routes are preserved while clients migrate. New V2 work should
# target the additive /api/v1/* contract so versioning does not break existing
# web/mobile consumers.
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

    # SabiWay V2 versioned aliases. These intentionally point to the same
    # business implementation during migration to avoid duplicate APIs.
    path("api/v1/health/", include("health.urls")),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/profiles/", include("profiles.urls")),
    path("api/v1/posts/", include("posts.urls")),
    path("api/v1/search/", include("search.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/marketplace/", include("marketplace.urls")),
    path("api/v1/verification/", include("verification.urls")),
    path("api/v1/sabipay/", include("sabipay.urls")),
]
