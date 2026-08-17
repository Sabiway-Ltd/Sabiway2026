import hashlib
import hmac
import json
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import Permission
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from marketplace.models import BookingRequest, MessageThread, ServiceCategory, ServiceListing
from verification.models import VerificationSubmission

from .gateway import PaystackError
from .models import GatewayWebhookEvent, PaymentAttempt, PayoutDestination, PayoutRecord, Transaction, TransactionAudit
from .services import mark_refunded, process_webhook


@override_settings(
    PAYSTACK_SECRET_KEY="phase7-test-secret",
    SABIPAY_COMMISSION_RATE=0.10,
    SABIPAY_FREEZE_DAYS=7,
)
class SabiPayJourneyTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(email="client-pay@example.com", full_name="Paying Client", password="StrongPassword123!", role=User.Role.CLIENT)
        self.provider_user = User.objects.create_user(email="provider-pay@example.com", full_name="Verified Provider", password="StrongPassword123!", role=User.Role.PROFESSIONAL)
        self.other_user = User.objects.create_user(email="other-pay@example.com", full_name="Other Client", password="StrongPassword123!", role=User.Role.CLIENT)
        self.admin_user = User.objects.create_superuser(email="finance-admin@example.com", full_name="Finance Admin", password="StrongPassword123!")
        self.client_profile = self.client_user.profile
        self.provider = self.provider_user.profile
        self.provider.country = "Nigeria"
        self.provider.save()
        self.other_profile = self.other_user.profile
        VerificationSubmission.objects.create(
            professional=self.provider,
            status=VerificationSubmission.Status.APPROVED,
            identity_type=VerificationSubmission.IdentityType.NATIONAL_ID,
            submitted_at=timezone.now(),
            decision_at=timezone.now(),
        )
        self.category, _ = ServiceCategory.objects.get_or_create(name="Phase 7 Services", defaults={"slug": "phase-7-services", "description": "Payment journey test category"})
        self.listing = ServiceListing.objects.create(
            provider=self.provider,
            category=self.category,
            title="Verified Nigeria service",
            description="Phase 7 escrow test service",
            price_from="100000.00",
            currency="NGN",
            country="Nigeria",
            state="Lagos",
            city="Ikeja",
            moderation_status=ServiceListing.ModerationStatus.PENDING,
        )
        self.thread = MessageThread.objects.create(client=self.client_profile, professional=self.provider, listing=self.listing)
        self.booking = BookingRequest.objects.create(
            client=self.client_profile,
            professional=self.provider,
            listing=self.listing,
            thread=self.thread,
            scope_summary="Deliver the agreed Phase 7 service",
            agreed_price="100000.00",
            currency="NGN",
            status=BookingRequest.Status.ACCEPTED,
            accepted_at=timezone.now(),
        )
        self.api = APIClient()

    def initialize_payload(self, *, key="phase7-idempotency-1"):
        self.api.force_authenticate(self.client_user)
        with patch("sabipay.gateway.initialize_payment", return_value={"authorization_url": "https://checkout.paystack.com/test", "access_code": "access-test"}):
            return self.api.post(
                "/api/sabipay/transactions/initialize/",
                {"booking_id": str(self.booking.id), "return_url": "http://localhost:3000/sabipay"},
                format="json",
                HTTP_IDEMPOTENCY_KEY=key,
            )

    def fund_transaction(self):
        response = self.initialize_payload()
        self.assertEqual(response.status_code, 200)
        tx = Transaction.objects.get(booking=self.booking)
        attempt = tx.payment_attempts.first()
        self.api.force_authenticate(self.client_user)
        with patch("sabipay.gateway.verify_payment", return_value={"status": "success", "amount": 10000000, "currency": "NGN", "id": 778899}):
            verify = self.api.post(f"/api/sabipay/transactions/{tx.id}/verify/", {"reference": attempt.reference}, format="json")
        self.assertEqual(verify.status_code, 200)
        tx.refresh_from_db()
        self.assertEqual(tx.state, Transaction.State.FUNDED)
        return tx

    def configure_destination(self):
        self.api.force_authenticate(self.provider_user)
        with patch("sabipay.gateway.resolve_account", return_value={"account_number": "0123456789", "account_name": "Verified Provider"}), patch(
            "sabipay.gateway.create_transfer_recipient", return_value={"recipient_code": "RCP_phase7_test"}
        ):
            response = self.api.post(
                "/api/sabipay/payout-destinations/",
                {"account_number": "0123456789", "bank_code": "058", "bank_name": "Test Bank"},
                format="json",
            )
        self.assertEqual(response.status_code, 200)
        destination = PayoutDestination.objects.get(professional=self.provider)
        self.assertEqual(destination.account_last4, "6789")
        self.assertFalse(hasattr(destination, "account_number"))
        return destination

    def test_successful_escrow_fee_delivery_and_client_release(self):
        first = self.initialize_payload()
        second = self.initialize_payload()
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        tx = Transaction.objects.get(booking=self.booking)
        self.assertEqual(tx.commission_amount, 10000)
        self.assertEqual(tx.provider_amount, 90000)
        self.assertEqual(PaymentAttempt.objects.filter(transaction=tx).count(), 1)

        attempt = tx.payment_attempts.first()
        self.api.force_authenticate(self.client_user)
        with patch("sabipay.gateway.verify_payment", return_value={"status": "success", "amount": 10000000, "currency": "NGN", "id": 1001}):
            verified = self.api.post(f"/api/sabipay/transactions/{tx.id}/verify/", {"reference": attempt.reference}, format="json")
        self.assertEqual(verified.status_code, 200)
        tx.refresh_from_db()
        self.assertEqual(tx.state, Transaction.State.FUNDED)

        self.api.force_authenticate(self.provider_user)
        started = self.api.post(f"/api/sabipay/transactions/{tx.id}/start-service/", {}, format="json")
        self.assertEqual(started.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, BookingRequest.Status.IN_PROGRESS)

        self.configure_destination()
        self.api.force_authenticate(self.provider_user)
        delivered = self.api.post(f"/api/sabipay/transactions/{tx.id}/mark-delivered/", {}, format="json")
        self.assertEqual(delivered.status_code, 200)
        tx.refresh_from_db()
        self.assertEqual(tx.state, Transaction.State.DELIVERED)
        self.assertAlmostEqual((tx.release_eligible_at - tx.delivered_at).total_seconds(), timedelta(days=7).total_seconds(), delta=2)

        self.api.force_authenticate(self.client_user)
        with patch("sabipay.gateway.initiate_transfer", return_value={"transfer_code": "TRF_phase7", "status": "pending"}):
            released = self.api.post(f"/api/sabipay/transactions/{tx.id}/confirm-satisfaction/", {}, format="json")
            replay = self.api.post(f"/api/sabipay/transactions/{tx.id}/confirm-satisfaction/", {}, format="json")
        self.assertEqual(released.status_code, 200)
        self.assertEqual(replay.status_code, 200)
        tx.refresh_from_db()
        self.assertEqual(tx.state, Transaction.State.RELEASED)
        self.assertEqual(PayoutRecord.objects.filter(transaction=tx).count(), 1)
        self.assertEqual(tx.payout.amount, 90000)
        self.assertEqual(tx.payout.status, PayoutRecord.Status.PROCESSING)
        self.assertTrue(TransactionAudit.objects.filter(transaction=tx, event="escrow_released_to_payout").exists())

    def test_service_cannot_start_without_funding_and_direct_booking_api_is_guarded(self):
        self.api.force_authenticate(self.provider_user)
        direct = self.api.post(f"/api/marketplace/bookings/{self.booking.id}/status/", {"status": "in_progress"}, format="json")
        self.assertEqual(direct.status_code, 400)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, BookingRequest.Status.ACCEPTED)

    def test_checkout_failure_is_recoverable_without_false_funding(self):
        self.api.force_authenticate(self.client_user)
        with patch("sabipay.gateway.initialize_payment", side_effect=PaystackError("sandbox unavailable")):
            response = self.api.post(
                "/api/sabipay/transactions/initialize/",
                {"booking_id": str(self.booking.id)},
                format="json",
                HTTP_IDEMPOTENCY_KEY="failed-attempt",
            )
        self.assertEqual(response.status_code, 400)
        tx = Transaction.objects.get(booking=self.booking)
        self.assertEqual(tx.state, Transaction.State.PENDING_PAYMENT)
        self.assertEqual(tx.payment_attempts.get().status, PaymentAttempt.Status.FAILED)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, BookingRequest.Status.ACCEPTED)

    def test_webhook_signature_replay_and_out_of_order_charge_are_state_safe(self):
        response = self.initialize_payload(key="webhook-attempt-one")
        tx = Transaction.objects.get(booking=self.booking)
        attempt = tx.payment_attempts.first()
        payload = {"event": "charge.success", "data": {"reference": attempt.reference}}
        raw = json.dumps(payload, separators=(",", ":")).encode()
        signature = hmac.new(b"phase7-test-secret", raw, hashlib.sha512).hexdigest()
        self.api.force_authenticate(user=None)
        with patch("sabipay.gateway.verify_payment", return_value={"status": "success", "amount": 10000000, "currency": "NGN", "id": 2002}):
            first = self.api.post("/api/sabipay/webhooks/paystack/", data=raw, content_type="application/json", HTTP_X_PAYSTACK_SIGNATURE=signature)
            second = self.api.post("/api/sabipay/webhooks/paystack/", data=raw, content_type="application/json", HTTP_X_PAYSTACK_SIGNATURE=signature)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        tx.refresh_from_db()
        self.assertEqual(tx.state, Transaction.State.FUNDED)
        self.assertEqual(GatewayWebhookEvent.objects.count(), 1)
        self.assertEqual(TransactionAudit.objects.filter(transaction=tx, event="escrow_funded").count(), 1)

        self.api.force_authenticate(self.client_user)
        with patch("sabipay.gateway.initialize_payment", return_value={"authorization_url": "https://checkout.paystack.com/second", "access_code": "second"}):
            extra = self.api.post(
                "/api/sabipay/transactions/initialize/",
                {"booking_id": str(self.booking.id)},
                format="json",
                HTTP_IDEMPOTENCY_KEY="webhook-attempt-two",
            )
        self.assertEqual(extra.status_code, 400)

    def test_automatic_release_waits_seven_days_and_releases_once(self):
        tx = self.fund_transaction()
        self.configure_destination()
        self.api.force_authenticate(self.provider_user)
        self.api.post(f"/api/sabipay/transactions/{tx.id}/start-service/", {}, format="json")
        self.api.post(f"/api/sabipay/transactions/{tx.id}/mark-delivered/", {}, format="json")
        tx.refresh_from_db()
        tx.release_eligible_at = timezone.now() - timedelta(seconds=1)
        tx.save(update_fields=["release_eligible_at", "updated_at"])
        with patch("sabipay.gateway.initiate_transfer", return_value={"transfer_code": "TRF_auto"}):
            call_command("release_due_escrow")
            call_command("release_due_escrow")
        tx.refresh_from_db()
        self.assertEqual(tx.state, Transaction.State.RELEASED)
        self.assertEqual(PayoutRecord.objects.filter(transaction=tx).count(), 1)

    def test_controlled_pre_service_refund_and_private_history(self):
        tx = self.fund_transaction()
        self.api.force_authenticate(self.admin_user)
        with patch("sabipay.gateway.initiate_refund", return_value={"id": 4455, "status": "pending"}):
            refund = self.api.post(f"/api/sabipay/transactions/{tx.id}/admin-refund/", {"reason": "Approved pre-service cancellation"}, format="json")
        self.assertEqual(refund.status_code, 200)
        tx.refresh_from_db()
        self.assertEqual(tx.refund_status, Transaction.RefundStatus.PENDING)
        mark_refunded(tx)
        tx.refresh_from_db()
        self.assertEqual(tx.state, Transaction.State.REFUNDED)

        self.api.force_authenticate(self.other_user)
        history = self.api.get("/api/sabipay/transactions/")
        self.assertEqual(history.status_code, 200)
        rows = history.data["results"] if isinstance(history.data, dict) and "results" in history.data else history.data
        self.assertEqual(len(rows), 0)

    def test_invalid_return_url_and_unsigned_webhook_are_rejected(self):
        self.api.force_authenticate(self.client_user)
        with patch("sabipay.gateway.initialize_payment") as init:
            response = self.api.post(
                "/api/sabipay/transactions/initialize/",
                {"booking_id": str(self.booking.id), "return_url": "https://evil.example/steal"},
                format="json",
            )
        self.assertEqual(response.status_code, 400)
        init.assert_not_called()
        self.api.force_authenticate(user=None)
        unsigned = self.api.post("/api/sabipay/webhooks/paystack/", {"event": "charge.success", "data": {}}, format="json")
        self.assertEqual(unsigned.status_code, 401)
