from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import VerificationDocumentViewSet, VerificationSubmissionViewSet

router = DefaultRouter()
router.register("submissions", VerificationSubmissionViewSet, basename="verification-submission")
router.register("documents", VerificationDocumentViewSet, basename="verification-document")

urlpatterns = [path("", include(router.urls))]
