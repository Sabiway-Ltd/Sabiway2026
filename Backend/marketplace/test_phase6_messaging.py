from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from verification.models import VerificationSubmission

from .models import Message, MessageThread, ServiceCategory, ServiceListing


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

    def test_accepts_supported_filename_and_records_safe_metadata(self):
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

    def test_path_components_are_not_kept_in_attachment_display_name(self):
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
