# notifications/views.py
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .pagination import NotificationPagination
from .realtime import broadcast_unread_count
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user.profile).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        unread_count = queryset.filter(is_read=False).count()
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True) if page is not None else self.get_serializer(queryset, many=True)
        notifications_with_user = [
            {"userId": str(request.user.id), "notification": notification}
            for notification in serializer.data
        ]

        payload = {
            "notifications": notifications_with_user,
            "unread_count": unread_count,
        }
        if page is not None:
            return self.get_paginated_response(payload)
        return Response(payload)


class MarkNotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        notification = get_object_or_404(
            Notification,
            id=kwargs["id"],
            user=request.user.profile,
        )
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])

        unread_count = Notification.objects.filter(
            user=request.user.profile,
            is_read=False,
        ).count()
        broadcast_unread_count(request.user.id, unread_count)
        return Response({
            "detail": "Notification marked as read",
            "unread_count": unread_count,
        })


class MarkAllNotificationsReadView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        user_profile = request.user.profile
        updated_count = Notification.objects.filter(
            user=user_profile,
            is_read=False,
        ).update(is_read=True)
        broadcast_unread_count(request.user.id, 0)
        return Response({
            "detail": "All notifications marked as read.",
            "updated_count": updated_count,
            "unread_count": 0,
        }, status=status.HTTP_200_OK)
