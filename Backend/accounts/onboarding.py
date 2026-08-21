from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from profiles.models import Profile
from profiles.serializers import ProfileSerializer

from .models import User
from .serializers import ClientOnboardingSerializer, UserSerializer


class ClientOnboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.CLIENT:
            return Response(
                {"detail": "Client onboarding is only available to Client accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile = Profile.objects.get(user=request.user)
        return Response(
            {
                "user": UserSerializer(request.user).data,
                "profile": ProfileSerializer(profile, context={"request": request}).data,
            }
        )

    def post(self, request):
        if request.user.role != User.Role.CLIENT:
            return Response(
                {"detail": "Client onboarding is only available to Client accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ClientOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            user = request.user
            user.full_name = data["full_name"]
            user.phone_number = data.get("phone_number", "")
            if not user.onboarding_completed_at:
                user.onboarding_completed_at = timezone.now()
            user.save(update_fields=["full_name", "phone_number", "onboarding_completed_at"])

            profile = Profile.objects.select_for_update().get(user=user)
            profile.phone_number = user.phone_number
            profile.country = data["country"]
            profile.state = data.get("state", "")
            profile.area = data.get("area", "")
            profile.save(update_fields=[
                "full_name", "initials", "phone_number", "country", "state", "area", "address", "role", "updated_at"
            ])

        user.refresh_from_db()
        profile.refresh_from_db()
        return Response(
            {
                "user": UserSerializer(user).data,
                "profile": ProfileSerializer(profile, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )
