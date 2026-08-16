from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DisputeCaseViewSet, DisputeEvidenceViewSet, FraudSignalViewSet, ReviewViewSet, SupportCaseViewSet

router = DefaultRouter()
router.register(r"disputes", DisputeCaseViewSet, basename="trust-dispute")
router.register(r"evidence", DisputeEvidenceViewSet, basename="trust-evidence")
router.register(r"reviews", ReviewViewSet, basename="trust-review")
router.register(r"support", SupportCaseViewSet, basename="trust-support")
router.register(r"fraud-signals", FraudSignalViewSet, basename="trust-fraud")

urlpatterns = [path("", include(router.urls))]
