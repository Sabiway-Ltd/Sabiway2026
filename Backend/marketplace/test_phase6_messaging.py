from unittest.mock import patch
from uuid import uuid4

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from verification.models import VerificationSubmission

from .models import ConversationReport, Message, MessageThread, ServiceCategory, ServiceListing
from .realtime import broadcast_marketplace_event


@override_settings(EXPRESS_URL="http://realtime.test")
class Phase6MessagingSafetyTests(TestCase):
    def setUp(self):
        self.provider_user = User.objects.create_user(
            email="phase6-provider@example.com",
            full_name="Phase Six Provider",
            password="StrongPassword123!",
            role=User.Role.PROFESSIONAL,
        )
        self.client_user = User.objects.create_user(
            email="phase6-client@example.com",
            full_name="Phase Six Client",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.provider = self.provider_user.profile
        self.client_profile = self.client_user.profile
        VerificationSubmission.objects.create(
            professional=self.provider,
            status=VerificationSubmission.Status.APPROVED,
            identity_type=VerificationSubmission.IdentityType.NATIONAL_ID,
        )
        category = ServiceCategory.objects.get(name="Electricians")
        listing = ServiceListing.objects.create(
            provider=self.provider,
            category=category,
            title="Phase 6 messaging service",
            description="Safe attachment regression fixture.",
            price_from="1000.00",
            moderation_status=ServiceListing.ModerationStatus.APPROVED,
        )
        self.thread = MessageThread.objects.create(
            client=self.client_profile,
            professional=self.provider,
            listing=listing,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.client_user)

    def test_rejects_filename_extension_that_conflicts_with_declared_mime(self):
        spoofed = SimpleUploadedFile(
            "invoice.exe",
            b"not really a text document",
            content_type="text/plain",
        )
        response = self.client.post(
            "/api/marketplace/messages/",
            {"thread_id": str(self.thread.id), "body": "Please see file", "attachment": spoofed},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("attachment", response.data)

    @patch("marketplace.realtime.requests.post")
    def test_accepts_supported_filename_and_records_safe_metadata(self, mock_post):
        mock_post.return_value.ok = True
        attachment = SimpleUploadedFile(
            "notes.txt",
            b"Safe notes",
            content_type="text/plain",
        )
        response = self.client.post(
            "/api/marketplace/messages/",
            {"thread_id": str(self.thread.id), "body": "Please see notes", "attachment": attachment},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        message = Message.objects.get(id=response.data["id"])
        self.assertEqual(message.attachment_name, "notes.txt")
        self.assertEqual(message.attachment_content_type, "text/plain")
        self.assertEqual(message.attachment_size, len(b"Safe notes"))

    @patch("marketplace.realtime.requests.post")
    def test_path_components_are_not_kept_in_attachment_display_name(self, mock_post):
        mock_post.return_value.ok = True
        attachment = SimpleUploadedFile(
            "../private/notes.txt",
            b"Safe notes",
            content_type="text/plain",
        )
        response = self.client.post(
            "/api/marketplace/messages/",
            {"thread_id": str(self.thread.id), "body": "Please see notes", "attachment": attachment},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        message = Message.objects.get(id=response.data["id"])
        self.assertNotIn("/", message.attachment_name)
        self.assertNotIn("\\", message.attachment_name)
        self.assertTrue(message.attachment_name.endswith("notes.txt"))

    @patch("marketplace.realtime.requests.post")
    def test_realtime_payload_converts_uuid_before_json_transport(self, mock_post):
        mock_post.return_value.ok = True
        value = uuid4()

        result = broadcast_marketplace_event(
            [self.provider_user.id],
            "new-message",
            {"id": value, "nested": {"thread": self.thread.id}},
        )

        self.assertTrue(result)
        sent = mock_post.call_args.kwargs["json"]
        self.assertEqual(sent["payload"]["id"], str(value))
        self.assertEqual(sent["payload"]["nested"]["thread"], str(self.thread.id))

    def test_thread_payload_exposes_directional_block_state(self):
        before = self.client.get("/api/marketplace/threads/")
        self.assertEqual(before.status_code, 200)
        thread = before.data[0] if isinstance(before.data, list) else before.data["results"][0]
        self.assertFalse(thread["is_blocked_by_me"])
        self.assertFalse(thread["is_blocked_by_other"])

        blocked = self.client.post(f"/api/marketplace/threads/{self.thread.id}/block/")
        self.assertEqual(blocked.status_code, 200)
        after = self.client.get("/api/marketplace/threads/")
        thread = after.data[0] if isinstance(after.data, list) else after.data["results"][0]
        self.assertTrue(thread["is_blocked_by_me"])
        self.assertFalse(thread["is_blocked_by_other"])

        unblocked = self.client.post(f"/api/marketplace/threads/{self.thread.id}/unblock/")
        self.assertEqual(unblocked.status_code, 200)
        final = self.client.get("/api/marketplace/threads/")
        thread = final.data[0] if isinstance(final.data, list) else final.data["results"][0]
        self.assertFalse(thread["is_blocked_by_me"])

    def test_duplicate_unresolved_conversation_report_is_rejected(self):
        first = self.client.post(
            f"/api/marketplace/threads/{self.thread.id}/report/",
            {"reason": "spam", "details": "Repeated unsolicited messages."},
            format="json",
        )
        self.assertEqual(first.status_code, 201)

        duplicate = self.client.post(
            f"/api/marketplace/threads/{self.thread.id}/report/",
            {"reason": "harassment", "details": "Same unresolved conversation."},
            format="json",
        )
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(ConversationReport.objects.filter(thread=self.thread, reporter=self.client_profile).count(), 1)

    def test_new_report_allowed_after_previous_report_resolved(self):
        report = ConversationReport.objects.create(
            thread=self.thread,
            reporter=self.client_profile,
            reported_user=self.provider,
            reason=ConversationReport.Reason.OTHER,
            details="Earlier case",
            status=ConversationReport.Status.DISMISSED,
        )
        self.assertEqual(report.status, ConversationReport.Status.DISMISSED)

        response = self.client.post(
            f"/api/marketplace/threads/{self.thread.id}/report/",
            {"reason": "fraud", "details": "New incident after earlier case was resolved."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ConversationReport.objects.filter(thread=self.thread, reporter=self.client_profile).count(), 2)
