# notifications/views.py
from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Notification
from .serializers import NotificationSerializer
from .pagination import NotificationPagination

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination 

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user.profile).order_by("-created_at")


class MarkNotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        notif = get_object_or_404(Notification, id=kwargs["id"], user=request.user.profile)
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response({"detail": "Notification marked as read"})



class MarkAllNotificationsReadView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        user_profile = request.user.profile

        # Efficient bulk update (NO looping, updates all in one query)
        updated_count = (
            Notification.objects
            .filter(user=user_profile, is_read=False)
            .update(is_read=True)
        )

        return Response(
            {
                "detail": "All notifications marked as read.",
                "updated_count": updated_count,
            },
            status=status.HTTP_200_OK,
        )
