from datetime import timedelta
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from marketplace.models import BookingRequest, MessageThread
from notifications.models import Notification, NotificationDelivery
from sabipay.models import Dispute, PayoutDestination, Transaction
from verification.models import VerificationSubmission

from .models import DisputeCase, DisputeEvidence, FraudSignal, Review, SupportAudit, SupportCase
from .services import decrypt_dispute_evidence


@override_settings(
    TRUST_EVIDENCE_KEY="snaP0PH4qqXmhRi8cERh7mBG76PxuoM623onWZfPAmM=",
    NOTIFICATION_REALTIME_DELIVERY_ENABLED=False,
    NOTIFICATION_PUSH_DELIVERY_ENABLED=False,
    NOTIFICATION_EMAIL_DELIVERY_ENABLED=False,
    SABIPAY_PARTIAL_DISPUTE_POLICY_ENABLED=False,
    TRUST_HIGH_VALUE_NGN=500000,
    TRUST_REPEAT_DISPUTE_THRESHOLD=3,
)
class TrustLifecycleTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(email="trust-client@example.com", full_name="Trust Client", password="StrongPassword123!")
        self.provider_user = User.objects.create_user(email="trust-provider@example.com", full_name="Trust Provider", password="StrongPassword123!")
        self.other_user = User.objects.create_user(email="trust-other@example.com", full_name="Other User", password="StrongPassword123!")
        self.admin_user = User.objects.create_superuser(email="trust-admin@example.com", full_name="Trust Admin", password="StrongPassword123!")
        self.client_profile = self.client_user.profile
        self.client_profile.role = "client"; self.client_profile.save()
        self.provider = self.provider_user.profile
        self.provider.role = "professional"; self.provider.save()
        self.other_profile = self.other_user.profile
        self.other_profile.role = "client"; self.other_profile.save()
        now = timezone.now()
        VerificationSubmission.objects.create(
            professional=self.provider,
            status=VerificationSubmission.Status.APPROVED,
            identity_type=VerificationSubmission.IdentityType.PASSPORT,
            reviewer=self.admin_user,
            submitted_at=now - timedelta(days=3),
            review_started_at=now - timedelta(days=2),
            decision_at=now - timedelta(days=2),
            sla_due_at=now - timedelta(days=1),
            decision_reason="Approved test provider for completed trust lifecycle journey.",
        )
        self.thread = MessageThread.objects.create(client=self.client_profile, professional=self.provider)
        self.booking = BookingRequest.objects.create(
            client=self.client_profile,
            professional=self.provider,
            thread=self.thread,
            scope_summary="Completed Phase 8 service",
            agreed_price="600000.00",
            currency="NGN",
            status=BookingRequest.Status.COMPLETED,
            accepted_at=now - timedelta(days=2),
        )
        self.tx = Transaction.objects.create(
            booking=self.booking,
            client=self.client_profile,
            professional=self.provider,
            amount="600000.00",
            currency="NGN",
            commission_rate="0.1000",
            commission_amount="60000.00",
            provider_amount="540000.00",
            state=Transaction.State.DELIVERED,
            receipt_number="SW-PHASE8-001",
            funding_reference="SWPAY-PHASE8-001",
            funded_at=now - timedelta(days=2),
            service_started_at=now - timedelta(days=1),
            delivered_at=now,
            release_eligible_at=now + timedelta(days=7),
        )
        PayoutDestination.objects.create(
            professional=self.provider,
            recipient_code="RCP_PHASE8",
            account_name="Trust Provider",
            bank_code="058",
            bank_name="Test Bank",
            account_last4="6789",
            verified_at=now,
        )
        self.api = APIClient()

    def test_dispute_freezes_release_encrypts_evidence_and_admin_can_review_it(self):
        self.api.force_authenticate(self.client_user)
        evidence = SimpleUploadedFile("proof.txt", b"private dispute evidence", content_type="text/plain")
        response = self.api.post(
            "/api/trust/disputes/",
            {"transaction_id": str(self.tx.id), "reason": "Service issue", "details": "The delivered result did not match the agreed scope.", "evidence": evidence},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.tx.refresh_from_db()
        self.assertEqual(self.tx.state, Transaction.State.DISPUTED)
        dispute = Dispute.objects.get(transaction=self.tx)
        stored = DisputeEvidence.objects.get(dispute=dispute)
        self.assertNotIn(b"private dispute evidence", bytes(stored.encrypted_payload))
        self.assertEqual(decrypt_dispute_evidence(stored), b"private dispute evidence")
        self.assertTrue(FraudSignal.objects.filter(dispute=dispute, code="high_value_dispute").exists())

        self.api.force_authenticate(self.other_user)
        forbidden = self.api.get(f"/api/trust/evidence/{stored.id}/download/")
        self.assertEqual(forbidden.status_code, 404)

        self.client.force_login(self.admin_user)
        admin_download = self.client.get(f"/api/trust/evidence/{stored.id}/download/")
        self.assertEqual(admin_download.status_code, 200)
        self.assertEqual(admin_download.content, b"private dispute evidence")
        self.assertEqual(admin_download["Cache-Control"], "private, no-store, max-age=0")

    def test_dispute_full_release_is_single_authorised_money_outcome(self):
        self.api.force_authenticate(self.client_user)
        opened = self.api.post("/api/trust/disputes/", {"transaction_id": str(self.tx.id), "reason": "Clarification needed", "details": "Please review the completed service."}, format="json")
        self.assertEqual(opened.status_code, 201)
        case = DisputeCase.objects.get(dispute__transaction=self.tx)

        self.api.force_authenticate(self.admin_user)
        self.assertEqual(self.api.post(f"/api/trust/disputes/{case.id}/start-review/", {}, format="json").status_code, 200)
        with patch("sabipay.gateway.initiate_transfer", return_value={"transfer_code": "TRF_TRUST", "status": "pending"}):
            decided = self.api.post(f"/api/trust/disputes/{case.id}/decision/", {"decision": "release_full", "reason": "Evidence supports full provider release."}, format="json")
        self.assertEqual(decided.status_code, 200)
        self.tx.refresh_from_db(); case.refresh_from_db()
        self.assertEqual(self.tx.state, Transaction.State.RELEASED)
        self.assertEqual(case.decision, DisputeCase.Decision.RELEASE_FULL)
        self.assertEqual(str(case.provider_release_amount), "540000.00")
        self.assertEqual(self.tx.payout.amount, self.tx.provider_amount)
        self.assertTrue(Notification.objects.filter(type="dispute", user=self.client_profile).exists())
        self.assertTrue(Notification.objects.filter(type="dispute", user=self.provider).exists())

    def test_full_refund_stays_frozen_until_gateway_completion_and_partial_is_blocked(self):
        self.api.force_authenticate(self.client_user)
        self.api.post("/api/trust/disputes/", {"transaction_id": str(self.tx.id), "reason": "Refund requested", "details": "Requesting refund after review."}, format="json")
        case = DisputeCase.objects.get(dispute__transaction=self.tx)
        self.api.force_authenticate(self.admin_user)
        partial = self.api.post(f"/api/trust/disputes/{case.id}/decision/", {"decision": "partial", "reason": "Attempt partial settlement before policy approval."}, format="json")
        self.assertEqual(partial.status_code, 400)
        self.tx.refresh_from_db()
        self.assertEqual(self.tx.state, Transaction.State.DISPUTED)

        with patch("sabipay.gateway.initiate_refund", return_value={"id": "RFN_PHASE8", "status": "pending"}):
            refunded = self.api.post(f"/api/trust/disputes/{case.id}/decision/", {"decision": "refund_full", "reason": "Evidence supports a full client refund."}, format="json")
        self.assertEqual(refunded.status_code, 200)
        self.tx.refresh_from_db()
        self.assertEqual(self.tx.state, Transaction.State.DISPUTED)
        self.assertEqual(self.tx.refund_status, Transaction.RefundStatus.PENDING)
        self.assertEqual(self.tx.refund_gateway_id, "RFN_PHASE8")

    def test_only_released_client_can_review_once_and_reputation_recalculates(self):
        self.tx.state = Transaction.State.RELEASED
        self.tx.released_at = timezone.now()
        self.tx.save(update_fields=["state", "released_at", "updated_at"])
        self.api.force_authenticate(self.provider_user)
        provider_attempt = self.api.post("/api/trust/reviews/", {"transaction_id": str(self.tx.id), "rating": 5}, format="json")
        self.assertEqual(provider_attempt.status_code, 403)

        self.api.force_authenticate(self.client_user)
        created = self.api.post("/api/trust/reviews/", {"transaction_id": str(self.tx.id), "rating": 4, "title": "Good service", "body": "Delivered the agreed result."}, format="json")
        self.assertEqual(created.status_code, 201)
        duplicate = self.api.post("/api/trust/reviews/", {"transaction_id": str(self.tx.id), "rating": 5}, format="json")
        self.assertEqual(duplicate.status_code, 400)
        self.provider.refresh_from_db()
        self.assertEqual(self.provider.rating_count, 1)
        self.assertEqual(str(self.provider.rating_average), "4.00")
        self.assertEqual(Review.objects.get(transaction=self.tx).moderation_status, Review.ModerationStatus.PUBLISHED)

    def test_support_escalation_preserves_notes_and_audit_and_creates_risk_signal(self):
        self.api.force_authenticate(self.client_user)
        opened = self.api.post("/api/trust/support/", {"category": "safety", "summary": "Need specialist review", "details": "Please review this completed service.", "transaction_id": str(self.tx.id)}, format="json")
        self.assertEqual(opened.status_code, 201)
        case = SupportCase.objects.get(opened_by=self.client_profile)
        note = self.api.post(f"/api/trust/support/{case.id}/note/", {"body": "Additional customer context", "internal": False}, format="json")
        self.assertEqual(note.status_code, 201)

        self.api.force_authenticate(self.admin_user)
        escalated = self.api.post(f"/api/trust/support/{case.id}/escalate/", {"reason": "High-risk safety case requires specialist handling.", "priority": "critical"}, format="json")
        self.assertEqual(escalated.status_code, 200)
        case.refresh_from_db()
        self.assertEqual(case.status, SupportCase.Status.ESCALATED)
        self.assertTrue(case.notes.filter(body="Additional customer context").exists())
        self.assertTrue(SupportAudit.objects.filter(case=case, event="case_escalated").exists())
        self.assertTrue(FraudSignal.objects.filter(support_case=case, code="critical_support_escalation").exists())

    def test_notification_failure_never_removes_authoritative_in_app_history(self):
        self.api.force_authenticate(self.client_user)
        self.tx.state = Transaction.State.RELEASED
        self.tx.released_at = timezone.now()
        self.tx.save(update_fields=["state", "released_at", "updated_at"])
        notification = Notification.objects.filter(user=self.client_profile, type="payment", metadata__transaction_id=str(self.tx.id)).latest("created_at")
        self.assertTrue(NotificationDelivery.objects.filter(notification=notification, channel="in_app", status="sent").exists())
        self.assertTrue(NotificationDelivery.objects.filter(notification=notification, channel="push", status="skipped").exists())
        self.assertTrue(NotificationDelivery.objects.filter(notification=notification, channel="email", status="skipped").exists())
        history = self.api.get("/api/notifications/")
        self.assertEqual(history.status_code, 200)
        self.assertGreaterEqual(Notification.objects.filter(user=self.client_profile).count(), 1)
