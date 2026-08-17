from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from verification.models import VerificationSubmission

from .models import (
    BookingRequest,
    JobPosting,
    JobResponse,
    MessageThread,
    ServiceCategory,
    ServiceListing,
)


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


class Phase7JobResponseLifecycleTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="phase7-job-client@example.com",
            full_name="Phase Seven Job Client",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.professional_user = User.objects.create_user(
            email="phase7-job-professional@example.com",
            full_name="Phase Seven Job Professional",
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
        self.category = ServiceCategory.objects.create(name="Phase Seven Services")
        self.job = JobPosting.objects.create(
            client=self.client_profile,
            category=self.category,
            title="Need a verified professional",
            description="Complete an agreed service task",
            budget_min="10000.00",
            budget_max="25000.00",
            currency="NGN",
            status=JobPosting.Status.OPEN,
            moderation_status=JobPosting.ModerationStatus.APPROVED,
        )
        self.response = JobResponse.objects.create(
            job=self.job,
            professional=self.professional_profile,
            message="I can complete this work.",
            proposed_price="18000.00",
            currency="NGN",
        )
        self.client_api = APIClient()
        self.client_api.force_authenticate(self.client_user)
        self.professional_api = APIClient()
        self.professional_api.force_authenticate(self.professional_user)

    def test_professional_can_withdraw_active_response_but_not_withdraw_again(self):
        withdrawn = self.professional_api.post(
            f"/api/marketplace/job-responses/{self.response.id}/withdraw/",
            {},
            format="json",
        )
        self.assertEqual(withdrawn.status_code, 200)
        self.response.refresh_from_db()
        self.assertEqual(self.response.status, JobResponse.Status.WITHDRAWN)

        repeated = self.professional_api.post(
            f"/api/marketplace/job-responses/{self.response.id}/withdraw/",
            {},
            format="json",
        )
        self.assertEqual(repeated.status_code, 400)
        self.response.refresh_from_db()
        self.assertEqual(self.response.status, JobResponse.Status.WITHDRAWN)

    def test_client_cannot_shortlist_withdrawn_response(self):
        self.response.status = JobResponse.Status.WITHDRAWN
        self.response.save(update_fields=["status", "updated_at"])

        decision = self.client_api.post(
            f"/api/marketplace/job-responses/{self.response.id}/decision/",
            {"status": JobResponse.Status.SHORTLISTED},
            format="json",
        )

        self.assertEqual(decision.status_code, 400)
        self.response.refresh_from_db()
        self.assertEqual(self.response.status, JobResponse.Status.WITHDRAWN)

    def test_declined_response_cannot_start_new_job_conversation(self):
        self.response.status = JobResponse.Status.DECLINED
        self.response.save(update_fields=["status", "updated_at"])

        thread = self.professional_api.post(
            "/api/marketplace/threads/",
            {"job_response_id": str(self.response.id)},
            format="json",
        )

        self.assertEqual(thread.status_code, 400)
        self.assertFalse(MessageThread.objects.filter(job_response=self.response).exists())

    def test_active_response_cannot_start_thread_after_job_closes(self):
        self.job.status = JobPosting.Status.CLOSED
        self.job.save(update_fields=["status", "updated_at"])

        thread = self.professional_api.post(
            "/api/marketplace/threads/",
            {"job_response_id": str(self.response.id)},
            format="json",
        )

        self.assertEqual(thread.status_code, 400)
        self.assertFalse(MessageThread.objects.filter(job_response=self.response).exists())


class Phase7MarketplaceProvenanceTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="phase7-provenance-client@example.com",
            full_name="Phase Seven Provenance Client",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.professional_user = User.objects.create_user(
            email="phase7-provenance-professional@example.com",
            full_name="Phase Seven Provenance Professional",
            password="StrongPassword123!",
            role=User.Role.PROFESSIONAL,
        )
        self.client_profile = self.client_user.profile
        self.professional_profile = self.professional_user.profile
        self.category = ServiceCategory.objects.create(name="Phase Seven Provenance")
        self.listing = ServiceListing.objects.create(
            provider=self.professional_profile,
            category=self.category,
            title="Original service scope",
            description="Original service description",
            price_from="12000.00",
            currency="NGN",
            moderation_status=ServiceListing.ModerationStatus.APPROVED,
        )
        self.job = JobPosting.objects.create(
            client=self.client_profile,
            category=self.category,
            title="Original job scope",
            description="Original job description",
            budget_min="15000.00",
            budget_max="30000.00",
            currency="NGN",
            status=JobPosting.Status.OPEN,
            moderation_status=JobPosting.ModerationStatus.APPROVED,
        )
        self.client_api = APIClient()
        self.client_api.force_authenticate(self.client_user)
        self.professional_api = APIClient()
        self.professional_api.force_authenticate(self.professional_user)

    def test_listing_material_edit_and_delete_are_blocked_after_conversation(self):
        MessageThread.objects.create(
            client=self.client_profile,
            professional=self.professional_profile,
            listing=self.listing,
        )

        changed = self.professional_api.patch(
            f"/api/marketplace/listings/{self.listing.id}/",
            {"price_from": "20000.00"},
            format="json",
        )
        self.assertEqual(changed.status_code, 400)
        self.listing.refresh_from_db()
        self.assertEqual(str(self.listing.price_from), "12000.00")

        deleted = self.professional_api.delete(
            f"/api/marketplace/listings/{self.listing.id}/"
        )
        self.assertEqual(deleted.status_code, 400)
        self.assertTrue(ServiceListing.objects.filter(pk=self.listing.pk).exists())

    def test_listing_operational_availability_can_change_after_conversation(self):
        MessageThread.objects.create(
            client=self.client_profile,
            professional=self.professional_profile,
            listing=self.listing,
        )

        changed = self.professional_api.patch(
            f"/api/marketplace/listings/{self.listing.id}/",
            {"available_now": True, "availability_text": "Available this week"},
            format="json",
        )
        self.assertEqual(changed.status_code, 200)
        self.listing.refresh_from_db()
        self.assertTrue(self.listing.available_now)
        self.assertEqual(self.listing.moderation_status, ServiceListing.ModerationStatus.APPROVED)

    def test_job_material_edit_and_delete_are_blocked_after_response(self):
        JobResponse.objects.create(
            job=self.job,
            professional=self.professional_profile,
            message="I can help",
            proposed_price="20000.00",
            currency="NGN",
        )

        changed = self.client_api.patch(
            f"/api/marketplace/jobs/{self.job.id}/",
            {"budget_max": "45000.00"},
            format="json",
        )
        self.assertEqual(changed.status_code, 400)
        self.job.refresh_from_db()
        self.assertEqual(str(self.job.budget_max), "30000.00")

        deleted = self.client_api.delete(f"/api/marketplace/jobs/{self.job.id}/")
        self.assertEqual(deleted.status_code, 400)
        self.assertTrue(JobPosting.objects.filter(pk=self.job.pk).exists())

    def test_job_can_close_after_response_without_resetting_moderation(self):
        JobResponse.objects.create(
            job=self.job,
            professional=self.professional_profile,
            message="I can help",
            proposed_price="20000.00",
            currency="NGN",
        )

        changed = self.client_api.patch(
            f"/api/marketplace/jobs/{self.job.id}/",
            {"status": JobPosting.Status.CLOSED},
            format="json",
        )
        self.assertEqual(changed.status_code, 200)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobPosting.Status.CLOSED)
        self.assertEqual(self.job.moderation_status, JobPosting.ModerationStatus.APPROVED)
