from django.urls import path

from .views import HealthCheckView, LivenessView

urlpatterns = [
    path("", HealthCheckView.as_view(), name="health-check"),
    path("live/", LivenessView.as_view(), name="health-live"),
    path("ready/", HealthCheckView.as_view(), name="health-ready"),
]
