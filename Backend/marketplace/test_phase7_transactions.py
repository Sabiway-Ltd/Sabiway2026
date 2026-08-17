from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from notifications.models import Notification
from verification.models import VerificationSubmission

from .models import BookingAudit, BookingRequest, MessageThread


class Phase7TransactionCertificationTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="phase7-client@example.com",
            full_name="Phase Seven Client",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.provider_user = User.objects.create_user(
            email="phase7-provider@example.com",
            full_name="Phase Seven Provider",
            password="StrongPassword123!",
            role=User.Role.PROFESSIONAL,
        )
        self.client_profile = self.client_user.profile
        self.provider = self.provider_user.profile
        VerificationSubmission.objects.create(
            professional=self.provider,
            status=VerificationSubmission.Status.APPROVED,
            identity_type=VerificationSubmission.IdentityType.NATIONAL_ID,
            submitted_at=timezone.now(),
            decision_at=timezone.now(),
        )
        self.thread = MessageThread.objects.create(client=self.client_profile, professional=self.provider)
        self.booking = BookingRequest.objects.create(
            client=self.client_profile,
            professional=self.provider,
            thread=self.thread,
            scope_summary="Repair a faulty socket",
            agreed_price="18000.00",
            currency="NGN",
        )

    @patch("marketplace.transaction_notifications.broadcast_notification", return_value=True)
    def test_audited_booking_creation_persists_recipient_notification(self, _broadcast):
        BookingAudit.objects.create(
            booking=self.booking,
            actor=self.client_profile,
            event="booking_created",
            to_status=BookingRequest.Status.PENDING,
            metadata={"scope": self.booking.scope_summary},
        )
        notification = Notification.objects.get(user=self.provider, type="booking")
        self.assertEqual(notification.actor, self.client_profile)
        self.assertEqual(notification.target_object_id, str(self.booking.id))
        self.assertIn("booking summary", notification.message.lower())

    @patch("marketplace.transaction_notifications.broadcast_notification", return_value=True)
    def test_each_audited_status_change_notifies_the_other_participant_once(self, _broadcast):
        BookingAudit.objects.create(
            booking=self.booking,
            actor=self.provider,
            event="status_changed",
            from_status=BookingRequest.Status.PENDING,
            to_status=BookingRequest.Status.ACCEPTED,
        )
        self.assertEqual(Notification.objects.filter(user=self.client_profile, type="booking").count(), 1)
        self.assertIn("accepted", Notification.objects.get(user=self.client_profile, type="booking").message.lower())

    @patch("marketplace.transaction_notifications.broadcast_notification", return_value=True)
    def test_schedule_audit_is_user_visible_and_booking_target_is_serializable(self, _broadcast):
        BookingAudit.objects.create(
            booking=self.booking,
            actor=self.client_profile,
            event="schedule_proposed",
            metadata={"proposed_for": "2026-08-20T10:30:00+01:00"},
        )
        notification = Notification.objects.get(user=self.provider, type="booking")
        from notifications.serializers import NotificationSerializer
        payload = NotificationSerializer(notification).data
        self.assertEqual(payload["target"]["type"], "bookingrequest")
        self.assertEqual(payload["target"]["id"], str(self.booking.id))

    def test_uuid_booking_create_does_not_run_update_only_sabipay_transition_guard(self):
        second_thread = MessageThread.objects.create(client=self.client_profile, professional=self.provider)
        created = BookingRequest.objects.create(
            client=self.client_profile,
            professional=self.provider,
            thread=second_thread,
            scope_summary="Another agreed service",
            agreed_price="5000.00",
            currency="NGN",
            status=BookingRequest.Status.PENDING,
        )
        self.assertEqual(created.status, BookingRequest.Status.PENDING)
