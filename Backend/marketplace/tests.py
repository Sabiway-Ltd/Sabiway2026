from datetime import timedelta
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from verification.models import VerificationSubmission

from .models import (
    BookingAudit,
    BookingRequest,
    ConversationBlock,
    ConversationReport,
    JobPosting,
    JobResponse,
    Message,
    MessageThread,
    ScheduleProposal,
    ServiceCategory,
    ServiceListing,
    ServiceSubcategory,
)


class MarketplaceJourneyTests(TestCase):
    def setUp(self):
        self.provider_user = User.objects.create_user(email="provider@example.com", full_name="Provider User", password="StrongPassword123!", role=User.Role.PROFESSIONAL)
        self.provider_two_user = User.objects.create_user(email="provider2@example.com", full_name="Provider Two", password="StrongPassword123!", role=User.Role.PROFESSIONAL)
        self.client_user = User.objects.create_user(email="client@example.com", full_name="Client User", password="StrongPassword123!", role=User.Role.CLIENT)
        self.other_client_user = User.objects.create_user(email="other@example.com", full_name="Other Client", password="StrongPassword123!", role=User.Role.CLIENT)
        self.provider = self.provider_user.profile; self.provider.country = "Nigeria"; self.provider.state = "Lagos"; self.provider.save()
        self.provider_two = self.provider_two_user.profile
        self.client_profile = self.client_user.profile
        self.other_client = self.other_client_user.profile
        now = timezone.now()
        VerificationSubmission.objects.create(professional=self.provider, status=VerificationSubmission.Status.APPROVED, identity_type=VerificationSubmission.IdentityType.NATIONAL_ID, submitted_at=now, decision_at=now)
        VerificationSubmission.objects.create(professional=self.provider_two, status=VerificationSubmission.Status.APPROVED, identity_type=VerificationSubmission.IdentityType.NATIONAL_ID, submitted_at=now, decision_at=now)
        self.category = ServiceCategory.objects.get(name="Electricians")
        self.subcategory = ServiceSubcategory.objects.get(category=self.category, slug="home-electrical-repairs")
        self.listing = ServiceListing.objects.create(provider=self.provider, category=self.category, subcategory=self.subcategory, title="Home electrical repairs", description="Fault finding and domestic electrical repairs.", price_from="15000.00", country="Nigeria", state="Lagos", city="Ikeja", area="Allen", available_now=True, moderation_status=ServiceListing.ModerationStatus.APPROVED)
        self.client = APIClient()

    def payload(self, response):
        return response.data["results"] if isinstance(response.data, dict) and "results" in response.data else response.data

    def test_phase4_discovery_and_role_boundaries_remain_intact(self):
        response = self.client.get("/api/marketplace/listings/?q=electrical&city=Ikeja&category=electricians&available_now=true")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(str(self.payload(response)[0]["id"]), str(self.listing.id))
        self.client.force_authenticate(self.provider_user)
        self.assertEqual(self.client.post("/api/marketplace/jobs/", {"category_id": self.category.id, "title": "Not allowed", "description": "x"}, format="json").status_code, 403)
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.post("/api/marketplace/listings/", {"category_id": self.category.id, "title": "Not allowed", "description": "x", "price_from": "1000"}, format="json").status_code, 403)

    @patch("marketplace.views.broadcast_marketplace_event", return_value=True)
    def test_direct_message_negotiation_booking_acceptance_and_schedule(self, _broadcast):
        self.client.force_authenticate(self.client_user)
        thread_response = self.client.post("/api/marketplace/threads/", {"listing_id": str(self.listing.id)}, format="json")
        self.assertEqual(thread_response.status_code, 201)
        thread = MessageThread.objects.get(id=thread_response.data["id"])
        self.assertEqual(thread.client, self.client_profile)
        self.assertEqual(thread.professional, self.provider)

        message = self.client.post("/api/marketplace/messages/", {"thread_id": str(thread.id), "body": "Can you repair three sockets this week?"}, format="json")
        self.assertEqual(message.status_code, 201)
        self.assertFalse(Message.objects.get(id=message.data["id"]).is_read)

        contact_blocked = self.client.post("/api/marketplace/messages/", {"thread_id": str(thread.id), "body": "Call me on 08012345678"}, format="json")
        self.assertEqual(contact_blocked.status_code, 400)

        booking_response = self.client.post("/api/marketplace/bookings/", {"thread_id": str(thread.id), "scope_summary": "Inspect and repair three faulty sockets", "agreed_price": "18000.00", "currency": "NGN", "timezone": "Africa/Lagos"}, format="json")
        self.assertEqual(booking_response.status_code, 201)
        booking = BookingRequest.objects.get(id=booking_response.data["id"])
        self.assertEqual(booking.professional, self.provider)
        self.assertEqual(booking.listing, self.listing)
        self.assertTrue(BookingAudit.objects.filter(booking=booking, event="booking_created").exists())

        self.client.force_authenticate(self.provider_user)
        accepted = self.client.post(f"/api/marketplace/bookings/{booking.id}/status/", {"status": "accepted"}, format="json")
        self.assertEqual(accepted.status_code, 200)
        booking.refresh_from_db(); self.assertEqual(booking.status, BookingRequest.Status.ACCEPTED)
        self.assertIsNotNone(booking.accepted_at)

        contact_allowed = self.client.post("/api/marketplace/messages/", {"thread_id": str(thread.id), "body": "Call me on 08012345678"}, format="json")
        self.assertEqual(contact_allowed.status_code, 201)

        proposed_for = timezone.now() + timedelta(days=2)
        proposal_response = self.client.post("/api/marketplace/schedule-proposals/", {"booking_id": str(booking.id), "proposed_for": proposed_for.isoformat(), "timezone": "Africa/Lagos", "note": "Morning works"}, format="json")
        self.assertEqual(proposal_response.status_code, 201)
        proposal = ScheduleProposal.objects.get(id=proposal_response.data["id"])

        self.client.force_authenticate(self.client_user)
        decision = self.client.post(f"/api/marketplace/schedule-proposals/{proposal.id}/decision/", {"status": "accepted"}, format="json")
        self.assertEqual(decision.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.schedule_status, BookingRequest.ScheduleStatus.ACCEPTED)
        self.assertEqual(booking.timezone, "Africa/Lagos")

        marked = self.client.post(f"/api/marketplace/threads/{thread.id}/mark-read/", {}, format="json")
        self.assertEqual(marked.status_code, 200)
        self.assertGreaterEqual(marked.data["marked_read"], 1)

    @patch("marketplace.views.broadcast_marketplace_event", return_value=True)
    def test_job_response_converts_to_linked_thread_and_booking(self, _broadcast):
        job = JobPosting.objects.create(client=self.client_profile, category=self.category, title="Fix sockets", description="Three sockets", moderation_status=JobPosting.ModerationStatus.APPROVED)
        response = JobResponse.objects.create(job=job, professional=self.provider, message="I can help", proposed_price="16000")
        self.client.force_authenticate(self.provider_user)
        thread_response = self.client.post("/api/marketplace/threads/", {"job_response_id": str(response.id)}, format="json")
        self.assertEqual(thread_response.status_code, 201)
        thread = MessageThread.objects.get(id=thread_response.data["id"])
        self.assertEqual(thread.job, job)
        self.assertEqual(thread.job_response, response)

        self.client.force_authenticate(self.client_user)
        booking_response = self.client.post("/api/marketplace/bookings/", {"thread_id": str(thread.id), "scope_summary": "Repair three sockets", "agreed_price": "16000", "currency": "NGN"}, format="json")
        self.assertEqual(booking_response.status_code, 201)
        booking = BookingRequest.objects.get(id=booking_response.data["id"])
        self.assertEqual(booking.job, job)
        self.assertEqual(booking.job_response, response)

    def test_block_report_nonparticipant_and_attachment_safety(self):
        thread = MessageThread.objects.create(client=self.client_profile, professional=self.provider, listing=self.listing)
        self.client.force_authenticate(self.client_user)
        report = self.client.post(f"/api/marketplace/threads/{thread.id}/report/", {"reason": "harassment", "details": "Repeated unwanted messages"}, format="json")
        self.assertEqual(report.status_code, 201)
        self.assertTrue(ConversationReport.objects.filter(thread=thread, reporter=self.client_profile, reported_user=self.provider).exists())

        blocked = self.client.post(f"/api/marketplace/threads/{thread.id}/block/", {}, format="json")
        self.assertEqual(blocked.status_code, 200)
        self.assertTrue(ConversationBlock.objects.filter(blocker=self.client_profile, blocked=self.provider, is_active=True).exists())

        self.client.force_authenticate(self.provider_user)
        denied_message = self.client.post("/api/marketplace/messages/", {"thread_id": str(thread.id), "body": "Can you see this?"}, format="json")
        self.assertEqual(denied_message.status_code, 400)

        self.client.force_authenticate(self.other_client_user)
        outsider_messages = self.client.get(f"/api/marketplace/messages/?thread={thread.id}")
        self.assertEqual(outsider_messages.status_code, 200)
        self.assertEqual(len(self.payload(outsider_messages)), 0)
        outsider_booking = self.client.post("/api/marketplace/bookings/", {"thread_id": str(thread.id), "scope_summary": "Hijack", "agreed_price": "1"}, format="json")
        self.assertEqual(outsider_booking.status_code, 400)

        self.client.force_authenticate(self.client_user)
        self.client.post(f"/api/marketplace/threads/{thread.id}/unblock/", {}, format="json")
        unsafe = SimpleUploadedFile("payload.exe", b"unsafe", content_type="application/x-msdownload")
        attachment = self.client.post("/api/marketplace/messages/", {"thread_id": str(thread.id), "body": "file", "attachment": unsafe}, format="multipart")
        self.assertEqual(attachment.status_code, 400)
