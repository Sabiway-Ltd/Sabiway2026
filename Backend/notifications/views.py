from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification, NotificationPreference, PushDevice
from .pagination import NotificationPagination
from .serializers import NotificationPreferenceSerializer, NotificationSerializer, PushDeviceSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user.profile).prefetch_related("deliveries").order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        unread_count = queryset.filter(is_read=False).count()
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True) if page is not None else self.get_serializer(queryset, many=True)
        notifications_with_user = [{"userId": str(request.user.id), "notification": item} for item in serializer.data]
        payload = {"notifications": notifications_with_user, "unread_count": unread_count}
        return self.get_paginated_response(payload) if page is not None else Response(payload)


class MarkNotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        notif = get_object_or_404(Notification, id=kwargs["id"], user=request.user.profile)
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        unread_count = Notification.objects.filter(user=request.user.profile, is_read=False).count()
        return Response({"detail": "Notification marked as read", "unread_count": unread_count})


class MarkAllNotificationsReadView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        updated_count = Notification.objects.filter(user=request.user.profile, is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read.", "updated_count": updated_count, "unread_count": 0}, status=status.HTTP_200_OK)


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        preference, _ = NotificationPreference.objects.get_or_create(profile=self.request.user.profile)
        return preference


class PushDeviceListCreateView(generics.ListCreateAPIView):
    serializer_class = PushDeviceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PushDevice.objects.filter(profile=self.request.user.profile).order_by("-last_seen_at")

    def perform_create(self, serializer):
        serializer.save()


class PushDeviceDeactivateView(generics.UpdateAPIView):
    serializer_class = PushDeviceSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        device = get_object_or_404(PushDevice, pk=kwargs["pk"], profile=request.user.profile)
        device.is_active = False
        device.last_seen_at = timezone.now()
        device.save(update_fields=["is_active", "last_seen_at"])
        return Response(PushDeviceSerializer(device).data)
