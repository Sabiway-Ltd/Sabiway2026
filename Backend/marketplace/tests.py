from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User

from .models import BookingRequest, ServiceCategory, ServiceListing


class MarketplaceJourneyTests(TestCase):
    def setUp(self):
        self.provider_user = User.objects.create_user(
            email="provider@example.com", full_name="Provider User", password="StrongPassword123!"
        )
        self.client_user = User.objects.create_user(
            email="client@example.com", full_name="Client User", password="StrongPassword123!"
        )
        self.other_user = User.objects.create_user(
            email="other@example.com", full_name="Other User", password="StrongPassword123!"
        )
        self.provider = self.provider_user.profile
        self.provider.role = "professional"
        self.provider.state = "Lagos"
        self.provider.save()
        self.client_profile = self.client_user.profile
        self.client_profile.role = "client"
        self.client_profile.save()
        self.other = self.other_user.profile
        self.category = ServiceCategory.objects.get(name="Electricians")
        self.listing = ServiceListing.objects.create(
            provider=self.provider,
            category=self.category,
            title="Home electrical repairs",
            description="Fault finding and domestic electrical repairs.",
            price_from="15000.00",
            state="Lagos",
            area="Ikeja",
        )
        self.client = APIClient()

    def test_public_can_discover_and_filter_active_listings(self):
        response = self.client.get("/api/marketplace/listings/?category=electricians&state=Lagos&q=electrical")
        self.assertEqual(response.status_code, 200)
        data = response.data["results"] if isinstance(response.data, dict) and "results" in response.data else response.data
        self.assertEqual(len(data), 1)
        self.assertEqual(str(data[0]["id"]), str(self.listing.id))
        self.assertNotIn("email", data[0]["provider"])
        self.assertNotIn("phone_number", data[0]["provider"])
        self.assertNotIn("street", data[0]["provider"])

    def test_only_professional_can_publish_and_owner_can_edit_listing(self):
        self.client.force_authenticate(self.client_user)
        rejected = self.client.post(
            "/api/marketplace/listings/",
            {"category_id": self.category.id, "title": "Not allowed", "description": "x", "price_from": "1000.00"},
            format="json",
        )
        self.assertEqual(rejected.status_code, 403)

        self.client.force_authenticate(self.provider_user)
        created = self.client.post(
            "/api/marketplace/listings/",
            {"category_id": self.category.id, "title": "Generator repairs", "description": "Repairs and diagnostics", "price_from": "20000.00", "state": "Lagos"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)

        self.client.force_authenticate(self.other_user)
        forbidden = self.client.patch(f"/api/marketplace/listings/{self.listing.id}/", {"title": "Hijacked"}, format="json")
        self.assertEqual(forbidden.status_code, 403)

    def test_client_to_provider_booking_status_journey(self):
        self.client.force_authenticate(self.client_user)
        created = self.client.post(
            "/api/marketplace/bookings/",
            {"listing_id": str(self.listing.id), "message": "Please visit tomorrow"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        booking = BookingRequest.objects.get(id=created.data["id"])
        self.assertEqual(booking.status, BookingRequest.Status.PENDING)

        self.client.force_authenticate(self.provider_user)
        accepted = self.client.post(
            f"/api/marketplace/bookings/{booking.id}/status/",
            {"status": "accepted"},
            format="json",
        )
        self.assertEqual(accepted.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, BookingRequest.Status.ACCEPTED)

        self.client.force_authenticate(self.client_user)
        cancelled = self.client.post(
            f"/api/marketplace/bookings/{booking.id}/status/",
            {"status": "cancelled"},
            format="json",
        )
        self.assertEqual(cancelled.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, BookingRequest.Status.CANCELLED)

    def test_provider_cannot_book_own_listing_and_outsider_cannot_see_booking(self):
        self.client.force_authenticate(self.provider_user)
        own = self.client.post(
            "/api/marketplace/bookings/",
            {"listing_id": str(self.listing.id)},
            format="json",
        )
        self.assertEqual(own.status_code, 400)

        booking = BookingRequest.objects.create(listing=self.listing, client=self.client_profile)
        self.client.force_authenticate(self.other_user)
        response = self.client.get(f"/api/marketplace/bookings/{booking.id}/")
        self.assertEqual(response.status_code, 404)
