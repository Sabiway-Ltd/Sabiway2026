from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .views import LoginView


class InternalReviewLoginView(APIView):
    """Issue a short-lived reviewer session for local/internal UI review only.

    This is deliberately disabled unless BOTH DEBUG and INTERNAL_REVIEW_MODE are
    enabled. It never creates staff/superuser access and cannot be used in the
    production configuration where DEBUG is false.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        if not (settings.DEBUG and getattr(settings, "INTERNAL_REVIEW_MODE", False)):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        role = str(request.data.get("role", "client")).strip().lower()
        if role not in {User.Role.CLIENT, User.Role.PROFESSIONAL}:
            return Response({"role": ["Choose client or professional."]}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        email = f"internal-review-{role}@review.sabiway.local"
        full_name = "SabiWay Review Client" if role == User.Role.CLIENT else "SabiWay Review Professional"

        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "role": role,
                "phone_number": "",
                "terms_accepted_at": now,
                "onboarding_completed_at": now,
                "is_active": True,
                "is_staff": False,
                "is_superuser": False,
            },
        )

        changed = False
        desired = {
            "full_name": full_name,
            "role": role,
            "is_active": True,
            "is_staff": False,
            "is_superuser": False,
        }
        for field, value in desired.items():
            if getattr(user, field) != value:
                setattr(user, field, value)
                changed = True
        if not user.terms_accepted_at:
            user.terms_accepted_at = now
            changed = True
        if not user.onboarding_completed_at:
            user.onboarding_completed_at = now
            changed = True
        if user.has_usable_password():
            user.set_unusable_password()
            changed = True
        if changed:
            user.save()

        refresh = RefreshToken.for_user(user)
        refresh["review_mode"] = True
        access = refresh.access_token
        access["review_mode"] = True
        access.set_exp(lifetime=timedelta(hours=8))
        refresh.set_exp(lifetime=timedelta(hours=8))

        payload = LoginView._session_payload(user, refresh)
        payload["access"] = str(access)
        payload["refresh"] = str(refresh)
        payload["review_mode"] = True
        return Response(payload, status=status.HTTP_200_OK)
