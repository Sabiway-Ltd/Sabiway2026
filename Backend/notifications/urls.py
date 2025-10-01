# notifications/urls.py

from django.urls import path
from .views import NotificationListView, MarkNotificationReadView

urlpatterns = [
    path("", NotificationListView.as_view(), name="notifications"),
    path("<int:id>/read/", MarkNotificationReadView.as_view(), name="notification-read"),
]
