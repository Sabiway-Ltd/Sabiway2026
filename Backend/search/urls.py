# search/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import SearchView


urlpatterns = [
    path("", SearchView.as_view(), name="search")
]