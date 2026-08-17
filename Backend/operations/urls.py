from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MeasurementSnapshotView, ProductEventIngestView, SupportCaseViewSet

router = DefaultRouter()
router.register("support-cases", SupportCaseViewSet, basename="support-case")

urlpatterns = [
    path("events/", ProductEventIngestView.as_view(), name="product-event-ingest"),
    path("measurement/", MeasurementSnapshotView.as_view(), name="measurement-snapshot"),
    path("", include(router.urls)),
]
