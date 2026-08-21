from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from marketplace.models import ServiceCategory, ServiceListing
from verification.models import VerificationSubmission


class PublicMarketplaceProfileTests(APITestCase):
    def setUp(self):
        self.professional = User.objects.create_user(
            email="public-pro@example.com",
            full_name="Public Professional",
            password="StrongPass123!",
            role=User.Role.PROFESSIONAL,
        )
        profile = self.professional.profile
        profile.username = "@public-professional"
        profile.phone_number = "+447700900123"
        profile.country = "United Kingdom"
        profile.state = "Lancashire"
        profile.area = "Private Area"
        profile.street = "Private Street"
        profile.bio = "Reliable local and remote support."
        profile.job = "Data Consultant"
        profile.save()

        VerificationSubmission.objects.create(
            professional=profile,
            status=VerificationSubmission.Status.APPROVED,
            identity_type=VerificationSubmission.IdentityType.PASSPORT,
            credential_summary="Approved test verification",
        )

        category = ServiceCategory.objects.create(name="Data Services")
        self.approved = ServiceListing.objects.create(
            provider=profile,
            category=category,
            title="Analytics dashboard support",
            description="Build and improve practical reporting dashboards.",
            price_from="120.00",
            currency="GBP",
            delivery_mode=ServiceListing.DeliveryMode.BOTH,
            country="United Kingdom",
            state="Lancashire",
            city="Preston",
            availability_text="Weekday evenings",
            available_now=True,
            moderation_status=ServiceListing.ModerationStatus.APPROVED,
            is_active=True,
        )
        ServiceListing.objects.create(
            provider=profile,
            category=category,
            title="Private draft service",
            description="Must never appear publicly.",
            price_from="50.00",
            currency="GBP",
            moderation_status=ServiceListing.ModerationStatus.DRAFT,
            is_active=True,
        )

    def test_public_profile_is_available_without_authentication(self):
        response = self.client.get("/api/profiles/public/public-professional/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["profile"]["full_name"], "Public Professional")
        self.assertEqual(response.data["profile"]["role"], User.Role.PROFESSIONAL)

    def test_public_profile_strips_private_identity_fields(self):
        response = self.client.get("/api/profiles/public/public-professional/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for private_field in (
            "email",
            "phone_number",
            "gender",
            "date_of_birth",
            "area",
            "street",
            "address",
            "onboarding_complete",
        ):
            self.assertNotIn(private_field, response.data["profile"])

    def test_only_approved_active_services_are_returned(self):
        response = self.client.get("/api/profiles/public/public-professional/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["services"]), 1)
        self.assertEqual(response.data["services"][0]["title"], self.approved.title)
        self.assertEqual(response.data["services"][0]["moderation_status"], ServiceListing.ModerationStatus.APPROVED)

    def test_unknown_public_profile_returns_not_found(self):
        response = self.client.get("/api/profiles/public/does-not-exist/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
