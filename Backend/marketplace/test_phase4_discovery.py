from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from verification.models import VerificationSubmission

from .models import ServiceCategory, ServiceListing


class Phase4MarketplaceDiscoveryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.provider_user = User.objects.create_user(
            email="phase4-provider@example.com",
            full_name="Phase Four Provider",
            password="StrongPassword123!",
            role=User.Role.PROFESSIONAL,
        )
        self.provider = self.provider_user.profile
        now = timezone.now()
        VerificationSubmission.objects.create(
            professional=self.provider,
            status=VerificationSubmission.Status.APPROVED,
            identity_type=VerificationSubmission.IdentityType.NATIONAL_ID,
            submitted_at=now,
            decision_at=now,
        )
        self.category, _ = ServiceCategory.objects.get_or_create(
            name="Phase 4 Test Services",
            defaults={"description": "Discovery regression fixtures"},
        )
        self.listing = ServiceListing.objects.create(
            provider=self.provider,
            category=self.category,
            title="Generator repair",
            description="Home generator diagnostics and repairs.",
            price_from="12000.00",
            country="Nigeria",
            state="Lagos",
            city="Ikeja",
            area="Allen Avenue",
            moderation_status=ServiceListing.ModerationStatus.APPROVED,
        )

    def test_generic_location_matches_country_state_city_or_area(self):
        for location in ["Nigeria", "Lagos", "Ikeja", "Allen"]:
            response = self.client.get("/api/marketplace/listings/", {"location": location})
            self.assertEqual(response.status_code, 200)
            ids = {str(item["id"]) for item in response.data["results"]}
            self.assertIn(str(self.listing.id), ids)

    def test_generic_and_structured_location_filters_can_be_combined(self):
        response = self.client.get(
            "/api/marketplace/listings/",
            {"location": "Lagos", "city": "Ikeja"},
        )
        self.assertEqual(response.status_code, 200)
        ids = {str(item["id"]) for item in response.data["results"]}
        self.assertIn(str(self.listing.id), ids)

        mismatch = self.client.get(
            "/api/marketplace/listings/",
            {"location": "Lagos", "city": "Abuja"},
        )
        self.assertEqual(mismatch.status_code, 200)
        self.assertNotIn(str(self.listing.id), {str(item["id"]) for item in mismatch.data["results"]})

    def test_marketplace_pagination_is_scoped_and_bounded(self):
        for index in range(30):
            ServiceListing.objects.create(
                provider=self.provider,
                category=self.category,
                title=f"Phase 4 service {index}",
                description="Pagination fixture",
                price_from="5000.00",
                country="Nigeria",
                state="Lagos",
                city="Ikeja",
                area="Maryland",
                moderation_status=ServiceListing.ModerationStatus.APPROVED,
            )

        first_page = self.client.get("/api/marketplace/listings/", {"page_size": 5})
        self.assertEqual(first_page.status_code, 200)
        self.assertEqual(len(first_page.data["results"]), 5)
        self.assertGreaterEqual(first_page.data["count"], 31)
        self.assertIsNotNone(first_page.data["next"])

        capped = self.client.get("/api/marketplace/listings/", {"page_size": 999})
        self.assertEqual(capped.status_code, 200)
        self.assertLessEqual(len(capped.data["results"]), 60)
