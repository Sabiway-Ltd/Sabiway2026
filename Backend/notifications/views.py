# notifications/views.py
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q

from .models import Notification
from .serializers import NotificationSerializer
from .pagination import NotificationPagination


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user.profile).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        unread_count = queryset.filter(is_read=False).count()

        # Pagination
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True) if page is not None else self.get_serializer(queryset, many=True)
        
        # Reshape response
        notifications_with_user = [
            {
                "userId": str(request.user.id),
                "notification": n
            } for n in serializer.data
        ]

        if page is not None:
            return self.get_paginated_response({
                "notifications": notifications_with_user,
                "unread_count": unread_count
            })

        return Response({
            "notifications": notifications_with_user,
            "unread_count": unread_count
        })


class MarkNotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        notif = get_object_or_404(Notification, id=kwargs["id"], user=request.user.profile)
        notif.is_read = True
        notif.save(update_fields=["is_read"])

        # Updated unread count
        unread_count = Notification.objects.filter(user=request.user.profile, is_read=False).count()

        # 🔹 Real-time update via Socket.io
        try:
            import requests
            from django.conf import settings
            requests.post(
                f"{settings.EXPRESS_URL}/broadcast-notification",
                json={
                    "userId": str(request.user.id),
                    "notification": {
                        "action": "update_unread_count",
                        "unread_count": unread_count
                    }
                },
                timeout=2
            )
        except Exception as e:
            print("⚠️ Real-time unread count update failed:", e)

        return Response({
            "detail": "Notification marked as read",
            "unread_count": unread_count
        })



class MarkAllNotificationsReadView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        user_profile = request.user.profile

        # Bulk update
        updated_count = Notification.objects.filter(user=user_profile, is_read=False).update(is_read=True)

        unread_count = 0  # all now read

        # 🔹 Real-time update via Socket.io
        try:
            import requests
            from django.conf import settings
            requests.post(
                f"{settings.EXPRESS_URL}/broadcast-notification",
                json={
                    "userId": str(request.user.id),
                    "notification": {
                        "action": "update_unread_count",
                        "unread_count": unread_count
                    }
                },
                timeout=2
            )
        except Exception as e:
            print("⚠️ Real-time unread count update failed:", e)

        return Response({
            "detail": "All notifications marked as read.",
            "updated_count": updated_count,
            "unread_count": unread_count
        }, status=status.HTTP_200_OK)
