from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SupportCaseViewSet

router = DefaultRouter()
router.register("support-cases", SupportCaseViewSet, basename="support-case")

urlpatterns = [path("", include(router.urls))]
