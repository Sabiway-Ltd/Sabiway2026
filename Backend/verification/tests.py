from datetime import timedelta

from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.test import APIClient

from accounts.models import User
from marketplace.models import BookingRequest, JobPosting, JobResponse, MessageThread, ServiceCategory, ServiceListing

from .models import VerificationAudit, VerificationDocument, VerificationSubmission


@override_settings(
    VERIFICATION_GATE_ENABLED=True,
    VERIFICATION_DOCUMENT_KEY="snaP0PH4qqXmhRi8cERh7mBG76PxuoM623onWZfPAmM=",
    VERIFICATION_REVIEW_SLA_HOURS=48,
    VERIFICATION_RETENTION_DAYS=365,
)
class VerificationJourneyTests(TestCase):
    def setUp(self):
        self.provider_user = User.objects.create_user(email="verify-provider@example.com", full_name="Verified Candidate", password="StrongPassword123!")
        self.provider = self.provider_user.profile
        self.provider.role = "professional"
        self.provider.save()
        self.client_user = User.objects.create_user(email="verify-client@example.com", full_name="Client", password="StrongPassword123!")
        self.client_profile = self.client_user.profile
        self.client_profile.role = "client"
        self.client_profile.save()
        self.reviewer = User.objects.create_user(email="reviewer@example.com", full_name="Reviewer", password="StrongPassword123!")
        self.reviewer.is_staff = True
        self.reviewer.save(update_fields=["is_staff"])
        self.reviewer.user_permissions.add(Permission.objects.get(codename="review_verification"))
        self.api = APIClient()
        self.identity = lambda: SimpleUploadedFile("passport.pdf", b"government-id-evidence", content_type="application/pdf")
        self.credential = lambda: SimpleUploadedFile("certificate.pdf", b"skill-evidence", content_type="application/pdf")

    def submit(self):
        self.api.force_authenticate(self.provider_user)
        return self.api.post("/api/verification/submissions/", {
            "identity_type": "passport",
            "credential_summary": "Qualified domestic electrician with five years of experience.",
            "country": "Nigeria",
            "state": "Lagos",
            "city": "Ikeja",
            "identity_document": self.identity(),
            "credential_document": self.credential(),
        }, format="multipart")

    def approve(self, submission):
        self.api.force_authenticate(self.reviewer)
        self.api.post(f"/api/verification/submissions/{submission.id}/start-review/", {}, format="json")
        return self.api.post(f"/api/verification/submissions/{submission.id}/decision/", {"status": "approved", "reason": "Identity and experience evidence checked."}, format="json")

    def test_professional_submits_encrypted_documents_and_tracks_status(self):
        response = self.submit()
        self.assertEqual(response.status_code, 201)
        submission = VerificationSubmission.objects.get(professional=self.provider)
        self.assertEqual(submission.status, VerificationSubmission.Status.SUBMITTED)
        self.assertIsNotNone(submission.sla_due_at)
        document = submission.documents.get(kind=VerificationDocument.Kind.IDENTITY)
        self.assertNotEqual(bytes(document.encrypted_payload), b"government-id-evidence")
        self.assertNotIn("encrypted_payload", response.data["documents"][0])
        self.assertTrue(VerificationAudit.objects.filter(submission=submission, event="submitted").exists())

        me = self.api.get("/api/verification/submissions/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["status"], "submitted")
        self.assertFalse(me.data["address_verification_required"])

    def test_document_download_is_owner_or_reviewer_only_and_no_store(self):
        self.submit()
        document = VerificationDocument.objects.get(submission__professional=self.provider, kind="identity")
        owner = self.api.get(f"/api/verification/documents/{document.id}/download/")
        self.assertEqual(owner.status_code, 200)
        self.assertEqual(owner.content, b"government-id-evidence")
        self.assertEqual(owner["Cache-Control"], "private, no-store, max-age=0")

        self.api.force_authenticate(self.client_user)
        denied = self.api.get(f"/api/verification/documents/{document.id}/download/")
        self.assertEqual(denied.status_code, 403)

        self.api.force_authenticate(self.reviewer)
        reviewer_download = self.api.get(f"/api/verification/documents/{document.id}/download/")
        self.assertEqual(reviewer_download.status_code, 200)

    def test_reviewer_decision_requires_permission_and_reason(self):
        self.submit()
        submission = VerificationSubmission.objects.get(professional=self.provider)
        outsider_staff = User.objects.create_user(email="staff@example.com", full_name="Staff", password="StrongPassword123!")
        outsider_staff.is_staff = True
        outsider_staff.save(update_fields=["is_staff"])
        self.api.force_authenticate(outsider_staff)
        self.assertEqual(self.api.post(f"/api/verification/submissions/{submission.id}/start-review/", {}).status_code, 403)

        self.api.force_authenticate(self.reviewer)
        started = self.api.post(f"/api/verification/submissions/{submission.id}/start-review/", {}, format="json")
        self.assertEqual(started.status_code, 200)
        no_reason = self.api.post(f"/api/verification/submissions/{submission.id}/decision/", {"status": "rejected", "reason": ""}, format="json")
        self.assertEqual(no_reason.status_code, 400)
        decided = self.api.post(f"/api/verification/submissions/{submission.id}/decision/", {"status": "more_info", "reason": "Upload a clearer passport image."}, format="json")
        self.assertEqual(decided.status_code, 200)
        self.assertEqual(decided.data["status"], "more_info")
        self.assertTrue(VerificationAudit.objects.filter(submission=submission, event="decision", to_status="more_info").exists())

    def test_more_information_resubmission_retains_history(self):
        self.submit()
        submission = VerificationSubmission.objects.get(professional=self.provider)
        self.api.force_authenticate(self.reviewer)
        self.api.post(f"/api/verification/submissions/{submission.id}/start-review/", {})
        self.api.post(f"/api/verification/submissions/{submission.id}/decision/", {"status": "more_info", "reason": "Need a clearer ID."}, format="json")
        self.api.force_authenticate(self.provider_user)
        resubmitted = self.api.post("/api/verification/submissions/resubmit/", {
            "identity_type": "passport",
            "credential_summary": "Updated evidence",
            "identity_document": SimpleUploadedFile("passport-v2.pdf", b"clearer-id", content_type="application/pdf"),
        }, format="multipart")
        self.assertEqual(resubmitted.status_code, 200)
        submission.refresh_from_db()
        self.assertEqual(submission.version, 2)
        self.assertEqual(submission.status, "submitted")
        self.assertEqual(submission.documents.count(), 3)
        self.assertTrue(VerificationAudit.objects.filter(submission=submission, event="resubmitted").exists())
        self.assertTrue(VerificationAudit.objects.filter(submission=submission, event="decision").exists())

    def test_unverified_provider_is_blocked_from_live_marketplace_and_booking(self):
        category = ServiceCategory.objects.get(name="Electricians")
        with self.assertRaises(PermissionDenied):
            ServiceListing.objects.create(provider=self.provider, category=category, title="Unsafe live listing", description="x", price_from="1000", moderation_status="approved")
        job = JobPosting.objects.create(client=self.client_profile, category=category, title="Need electrician", description="Sockets", moderation_status="approved")
        with self.assertRaises(PermissionDenied):
            JobResponse.objects.create(job=job, professional=self.provider, message="I can help")
        thread = MessageThread.objects.create(client=self.client_profile, professional=self.provider)
        with self.assertRaises(PermissionDenied):
            BookingRequest.objects.create(thread=thread, client=self.client_profile, professional=self.provider, scope_summary="Repair", agreed_price="1000")

    def test_approved_provider_unlocks_listing_job_response_and_booking(self):
        self.submit()
        submission = VerificationSubmission.objects.get(professional=self.provider)
        approved = self.approve(submission)
        self.assertEqual(approved.status_code, 200)
        self.assertEqual(approved.data["status"], "approved")
        category = ServiceCategory.objects.get(name="Electricians")
        listing = ServiceListing.objects.create(provider=self.provider, category=category, title="Verified repairs", description="Safe", price_from="1000", moderation_status="approved")
        job = JobPosting.objects.create(client=self.client_profile, category=category, title="Need electrician", description="Sockets", moderation_status="approved")
        response = JobResponse.objects.create(job=job, professional=self.provider, message="I can help")
        thread = MessageThread.objects.create(client=self.client_profile, professional=self.provider, listing=listing, job=job, job_response=response)
        booking = BookingRequest.objects.create(thread=thread, client=self.client_profile, professional=self.provider, listing=listing, scope_summary="Repair", agreed_price="1000")
        self.assertIsNotNone(booking.pk)

    def test_losing_approval_removes_live_listing(self):
        self.submit()
        submission = VerificationSubmission.objects.get(professional=self.provider)
        self.approve(submission)
        category = ServiceCategory.objects.get(name="Electricians")
        listing = ServiceListing.objects.create(provider=self.provider, category=category, title="Verified repairs", description="Safe", price_from="1000", moderation_status="approved", is_featured=True)
        submission.status = VerificationSubmission.Status.MORE_INFO
        submission.save()
        listing.refresh_from_db()
        self.assertEqual(listing.moderation_status, ServiceListing.ModerationStatus.PENDING)
        self.assertFalse(listing.is_featured)

    def test_invalid_document_type_and_retention_purge(self):
        self.api.force_authenticate(self.provider_user)
        invalid = self.api.post("/api/verification/submissions/", {
            "identity_type": "passport",
            "identity_document": SimpleUploadedFile("malware.exe", b"bad", content_type="application/x-msdownload"),
        }, format="multipart")
        self.assertEqual(invalid.status_code, 400)

        self.submit()
        document = VerificationDocument.objects.filter(submission__professional=self.provider).first()
        document.retention_until = timezone.now() - timedelta(seconds=1)
        document.save(update_fields=["retention_until"])
        call_command("purge_verification_documents")
        document.refresh_from_db()
        self.assertEqual(bytes(document.encrypted_payload), b"")
        self.assertIsNotNone(document.purged_at)
        self.assertTrue(VerificationAudit.objects.filter(submission=document.submission, event="document_purged").exists())
