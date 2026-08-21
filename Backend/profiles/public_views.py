from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from marketplace.models import ServiceListing
from marketplace.serializers import ServiceListingSerializer

from .models import Profile
from .serializers import ProfileSerializer


class PublicMarketplaceProfileView(APIView):
    """Return marketplace-safe public identity plus approved services.

    This endpoint is intentionally read-only and public. Privacy is enforced by
    ProfileSerializer.to_representation; service visibility follows the same
    approval/active rules as public marketplace discovery.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        normalised = username if username.startswith("@") else f"@{username}"
        profile = get_object_or_404(
            Profile.objects.select_related("user"),
            username__iexact=normalised,
        )

        services = ServiceListing.objects.select_related(
            "provider__user", "category", "subcategory"
        ).filter(
            provider=profile,
            is_active=True,
            moderation_status=ServiceListing.ModerationStatus.APPROVED,
            category__is_active=True,
        ).order_by("-available_now", "-updated_at")

        return Response(
            {
                "profile": ProfileSerializer(profile, context={"request": request}).data,
                "services": ServiceListingSerializer(
                    services, many=True, context={"request": request}
                ).data,
            }
        )
