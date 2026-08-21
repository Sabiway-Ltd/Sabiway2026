from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from marketplace.models import ServiceListing
from marketplace.serializers import ServiceListingSerializer
from reputation.models import ProfessionalReview
from reputation.serializers import PublicProfessionalReviewSerializer
from verification.models import VerificationSubmission

from .models import Profile
from .serializers import ProfileSerializer


class PublicMarketplaceProfileView(APIView):
    """Return marketplace-safe public identity, services and explainable trust signals.

    This endpoint is intentionally read-only and public. Privacy is enforced by
    ProfileSerializer.to_representation; service visibility follows the same
    approval/active rules as public marketplace discovery. Verification exposes
    only an approved/not-approved signal. Reputation is derived only from
    completed-work reviews and never exposes booking or verification internals.
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

        reviews = ProfessionalReview.objects.select_related("client__user").filter(
            professional=profile
        )
        aggregate = reviews.aggregate(
            average_rating=Avg("rating"),
            review_count=Count("id"),
        )
        average_rating = aggregate["average_rating"]
        is_verified = VerificationSubmission.objects.filter(
            professional=profile,
            status=VerificationSubmission.Status.APPROVED,
        ).exists()

        return Response(
            {
                "profile": ProfileSerializer(profile, context={"request": request}).data,
                "services": ServiceListingSerializer(
                    services, many=True, context={"request": request}
                ).data,
                "trust": {
                    "verification": {
                        "is_verified": is_verified,
                        "label": "Verified Professional" if is_verified else "Not verified",
                    },
                    "reputation": {
                        "average_rating": round(float(average_rating), 2) if average_rating is not None else None,
                        "review_count": aggregate["review_count"],
                        "reviews": PublicProfessionalReviewSerializer(
                            reviews[:10], many=True
                        ).data,
                    },
                },
            }
        )
