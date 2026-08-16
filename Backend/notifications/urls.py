from django.urls import path

from .views import (
    MarkAllNotificationsReadView,
    MarkNotificationReadView,
    NotificationListView,
    NotificationPreferenceView,
    PushDeviceDeactivateView,
    PushDeviceListCreateView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notifications"),
    path("<int:id>/read/", MarkNotificationReadView.as_view(), name="notification-read"),
    path("read/all/", MarkAllNotificationsReadView.as_view(), name="notifications-read-all"),
    path("preferences/", NotificationPreferenceView.as_view(), name="notification-preferences"),
    path("devices/", PushDeviceListCreateView.as_view(), name="notification-devices"),
    path("devices/<int:pk>/deactivate/", PushDeviceDeactivateView.as_view(), name="notification-device-deactivate"),
]
