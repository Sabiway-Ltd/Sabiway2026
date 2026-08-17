from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from verification.models import VerificationSubmission

from .models import BookingRequest, MessageThread


class Phase7BookingHandoffTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="phase7-client@example.com",
            full_name="Phase Seven Client",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.professional_user = User.objects.create_user(
            email="phase7-professional@example.com",
            full_name="Phase Seven Professional",
            password="StrongPassword123!",
            role=User.Role.PROFESSIONAL,
        )
        self.client_profile = self.client_user.profile
        self.professional_profile = self.professional_user.profile
        VerificationSubmission.objects.create(
            professional=self.professional_profile,
            status=VerificationSubmission.Status.APPROVED,
            identity_type=VerificationSubmission.IdentityType.NATIONAL_ID,
        )
        self.thread = MessageThread.objects.create(
            client=self.client_profile,
            professional=self.professional_profile,
        )
        self.client_api = APIClient()
        self.client_api.force_authenticate(self.client_user)
        self.professional_api = APIClient()
        self.professional_api.force_authenticate(self.professional_user)

    def test_booking_agreement_requires_positive_price(self):
        response = self.client_api.post(
            "/api/marketplace/bookings/",
            {
                "thread_id": str(self.thread.id),
                "scope_summary": "Complete the agreed service",
                "agreed_price": "0.00",
                "currency": "NGN",
                "timezone": "Africa/Lagos",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("agreed_price", response.data)
        self.assertFalse(BookingRequest.objects.filter(thread=self.thread).exists())

    @patch("marketplace.views.broadcast_marketplace_event")
    def test_generic_booking_status_cannot_bypass_funded_service_flow(self, mock_broadcast):
        created = self.client_api.post(
            "/api/marketplace/bookings/",
            {
                "thread_id": str(self.thread.id),
                "scope_summary": "Complete the agreed service",
                "agreed_price": "25000.00",
                "currency": "NGN",
                "timezone": "Africa/Lagos",
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        booking_id = created.data["id"]

        accepted = self.professional_api.post(
            f"/api/marketplace/bookings/{booking_id}/status/",
            {"status": BookingRequest.Status.ACCEPTED},
            format="json",
        )
        self.assertEqual(accepted.status_code, 200)

        bypass = self.professional_api.post(
            f"/api/marketplace/bookings/{booking_id}/status/",
            {"status": BookingRequest.Status.IN_PROGRESS},
            format="json",
        )

        self.assertEqual(bypass.status_code, 400)
        self.assertIn("status", bypass.data)
        booking = BookingRequest.objects.get(pk=booking_id)
        self.assertEqual(booking.status, BookingRequest.Status.ACCEPTED)
