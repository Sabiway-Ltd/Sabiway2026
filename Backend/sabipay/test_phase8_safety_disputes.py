from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from marketplace.models import BookingRequest, MessageThread
from notifications.models import Notification
from verification.models import VerificationSubmission

from . import gateway
from .models import Dispute, PaymentAttempt, Transaction
from .services import reconcile_transaction, split_amount


class Phase8PaymentSafetyDisputeTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="phase8-client@example.com",
            full_name="Phase Eight Client",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.provider_user = User.objects.create_user(
            email="phase8-provider@example.com",
            full_name="Phase Eight Provider",
            password="StrongPassword123!",
            role=User.Role.PROFESSIONAL,
        )
        self.other_user = User.objects.create_user(
            email="phase8-other@example.com",
            full_name="Outside Client",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.operator = User.objects.create_superuser(
            email="phase8-operator@example.com",
            full_name="SabiPay Operator",
            password="StrongPassword123!",
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
            scope_summary="Repair three sockets",
            agreed_price="20000.00",
            currency="NGN",
            status=BookingRequest.Status.ACCEPTED,
        )
        self.api = APIClient()

    def transaction(self, state=Transaction.State.PENDING_PAYMENT):
        fee, provider_amount = split_amount(self.booking.agreed_price)
        return Transaction.objects.create(
            booking=self.booking,
            client=self.client_profile,
            professional=self.provider,
            amount=self.booking.agreed_price,
            currency="NGN",
            commission_rate="0.1000",
            commission_amount=fee,
            provider_amount=provider_amount,
            state=state,
            payment_status=Transaction.PaymentStatus.SUCCEEDED if state != Transaction.State.PENDING_PAYMENT else Transaction.PaymentStatus.PENDING,
            funding_reference="SWPAY-PHASE8" if state != Transaction.State.PENDING_PAYMENT else "",
            receipt_number="SW-PHASE8-0001",
            funded_at=timezone.now() if state != Transaction.State.PENDING_PAYMENT else None,
        )

    @patch("sabipay.notifications.broadcast_notification", return_value=True)
    @patch("sabipay.gateway.initialize_payment")
    def test_repeated_pay_click_is_idempotent(self, initialize_payment, _broadcast):
        initialize_payment.return_value = {"authorization_url": "https://checkout.example.test/abc", "access_code": "abc"}
        self.api.force_authenticate(self.client_user)
        headers = {"HTTP_IDEMPOTENCY_KEY": "same-payment-click"}
        first = self.api.post("/api/sabipay/transactions/initialize/", {"booking_id": str(self.booking.id)}, format="json", **headers)
        second = self.api.post("/api/sabipay/transactions/initialize/", {"booking_id": str(self.booking.id)}, format="json", **headers)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["reference"], second.data["reference"])
        self.assertEqual(PaymentAttempt.objects.count(), 1)
        initialize_payment.assert_called_once()

    @patch("sabipay.notifications.broadcast_notification", return_value=True)
    @patch("sabipay.gateway.verify_payment")
    def test_failed_payment_is_recoverable_not_false_funding(self, verify_payment, _broadcast):
        tx = self.transaction()
        attempt = PaymentAttempt.objects.create(transaction=tx, reference="SWPAY-FAILED", authorization_url="https://checkout.example.test/fail")
        verify_payment.return_value = {"status": "failed", "amount": 2000000, "currency": "NGN", "message": "Declined"}
        self.api.force_authenticate(self.client_user)
        response = self.api.post(f"/api/sabipay/transactions/{tx.id}/refresh-status/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        tx.refresh_from_db(); attempt.refresh_from_db()
        self.assertEqual(tx.state, Transaction.State.PENDING_PAYMENT)
        self.assertEqual(tx.payment_status, Transaction.PaymentStatus.FAILED)
        self.assertEqual(attempt.status, PaymentAttempt.Status.FAILED)
        self.assertNotEqual(tx.reconciliation_status, Transaction.ReconciliationStatus.MATCHED)

    @patch("sabipay.notifications.broadcast_notification", return_value=True)
    @patch("sabipay.gateway.verify_payment", side_effect=gateway.PaystackError("temporary timeout"))
    def test_slow_gateway_remains_pending_instead_of_false_mismatch(self, _verify, _broadcast):
        tx = self.transaction()
        PaymentAttempt.objects.create(transaction=tx, reference="SWPAY-PENDING")
        reconcile_transaction(tx)
        tx.refresh_from_db()
        self.assertEqual(tx.reconciliation_status, Transaction.ReconciliationStatus.PENDING)
        self.assertEqual(tx.payment_status, Transaction.PaymentStatus.PENDING)
        self.assertIn("pending", tx.reconciliation_note.lower())

    @patch("sabipay.notifications.broadcast_notification", return_value=True)
    def test_participant_can_open_dispute_add_evidence_and_freeze_transaction(self, _broadcast):
        tx = self.transaction(Transaction.State.DELIVERED)
        tx.delivered_at = timezone.now(); tx.release_eligible_at = timezone.now(); tx.save()
        self.api.force_authenticate(self.client_user)
        opened = self.api.post("/api/sabipay/disputes/", {
            "transaction_id": str(tx.id),
            "reason": Dispute.Reason.SERVICE_NOT_AS_AGREED,
            "details": "The work was marked delivered but the agreed fault remains unresolved.",
        }, format="json")
        self.assertEqual(opened.status_code, 201)
        dispute = Dispute.objects.get(pk=opened.data["id"])
        tx.refresh_from_db()
        self.assertEqual(tx.state, Transaction.State.DISPUTED)
        self.assertEqual(dispute.transaction_state_at_open, Transaction.State.DELIVERED)
        evidence = self.api.post(f"/api/sabipay/disputes/{dispute.id}/evidence/", {
            "note": "Photo and conversation reference showing the unresolved socket.",
            "reference_url": "https://example.test/evidence/1",
        }, format="json")
        self.assertEqual(evidence.status_code, 201)
        self.assertEqual(dispute.evidence.count(), 1)
        self.assertTrue(Notification.objects.filter(type="dispute", user=self.provider).exists())

        duplicate = self.api.post("/api/sabipay/disputes/", {
            "transaction_id": str(tx.id), "reason": Dispute.Reason.OTHER, "details": "A second active dispute should not be possible."
        }, format="json")
        self.assertEqual(duplicate.status_code, 400)

    @patch("sabipay.notifications.broadcast_notification", return_value=True)
    def test_outsider_cannot_read_or_open_transaction_dispute(self, _broadcast):
        tx = self.transaction(Transaction.State.FUNDED)
        self.api.force_authenticate(self.other_user)
        opened = self.api.post("/api/sabipay/disputes/", {
            "transaction_id": str(tx.id), "reason": Dispute.Reason.OTHER, "details": "I should not have access to this transaction."
        }, format="json")
        self.assertEqual(opened.status_code, 403)
        listing = self.api.get("/api/sabipay/disputes/")
        self.assertEqual(listing.status_code, 200)
        rows = listing.data["results"] if isinstance(listing.data, dict) and "results" in listing.data else listing.data
        self.assertEqual(len(rows), 0)

    @patch("sabipay.notifications.broadcast_notification", return_value=True)
    def test_operator_review_and_resume_resolution_restores_safe_state(self, _broadcast):
        tx = self.transaction(Transaction.State.IN_PROGRESS)
        self.api.force_authenticate(self.client_user)
        opened = self.api.post("/api/sabipay/disputes/", {
            "transaction_id": str(tx.id),
            "reason": Dispute.Reason.SAFETY_CONCERN,
            "details": "I need SabiWay to pause this transaction while the issue is reviewed.",
        }, format="json")
        dispute_id = opened.data["id"]

        self.api.force_authenticate(self.operator)
        review = self.api.post(f"/api/sabipay/disputes/{dispute_id}/start-review/", {}, format="json")
        self.assertEqual(review.status_code, 200)
        resolved = self.api.post(f"/api/sabipay/disputes/{dispute_id}/resolve/", {
            "outcome": Dispute.Outcome.RESUME,
            "resolution": "Evidence reviewed; transaction can safely resume from the state captured when the dispute opened.",
        }, format="json")
        self.assertEqual(resolved.status_code, 200)
        tx.refresh_from_db()
        dispute = Dispute.objects.get(pk=dispute_id)
        self.assertEqual(dispute.status, Dispute.Status.RESOLVED)
        self.assertEqual(dispute.outcome, Dispute.Outcome.RESUME)
        self.assertEqual(tx.state, Transaction.State.IN_PROGRESS)
