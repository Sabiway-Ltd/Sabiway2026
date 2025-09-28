# docs/urls.py
from django.urls import path
from .views import AuthDocsView

urlpatterns = [
    path("auth/", AuthDocsView.as_view(), name="api-docs"),
]
