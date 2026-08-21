from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from sabipay.models import Transaction
from verification.models import VerificationSubmission

from .models import BookingRequest, MessageThread, ScheduleProposal


class Phase15BookingCapabilityTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="phase15-client@example.com",
            full_name="Phase 15 Client",
            password="StrongPass123!",
            role=User.Role.CLIENT,
        )
        self.professional_user = User.objects.create_user(
            email="phase15-professional@example.com",
            full_name="Phase 15 Professional",
            password="StrongPass123!",
            role=User.Role.PROFESSIONAL,
        )
        self.outsider = User.objects.create_user(
            email="phase15-outsider@example.com",
            full_name="Phase 15 Outsider",
            password="StrongPass123!",
            role=User.Role.CLIENT,
        )
        VerificationSubmission.objects.create(
            professional=self.professional_user.profile,
            status=VerificationSubmission.Status.APPROVED,
            identity_type=VerificationSubmission.IdentityType.PASSPORT,
        )
        self.thread = MessageThread.objects.create(
            client=self.client_user.profile,
            professional=self.professional_user.profile,
        )
        self.booking = BookingRequest.objects.create(
            client=self.client_user.profile,
            professional=self.professional_user.profile,
            thread=self.thread,
            scope_summary="Phase 15 service",
            agreed_price=Decimal("100.00"),
            currency="NGN",
            status=BookingRequest.Status.ACCEPTED,
        )

    def capabilities_for(self, user):
        self.client.force_authenticate(user)
        response = self.client.get("/api/marketplace/booking-capabilities/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data

    def transaction(self, state):
        return Transaction.objects.create(
            booking=self.booking,
            client=self.client_user.profile,
            professional=self.professional_user.profile,
            amount=Decimal("100.00"),
            currency="NGN",
            commission_rate=Decimal("0.1000"),
            commission_amount=Decimal("10.00"),
            provider_amount=Decimal("90.00"),
            state=state,
            receipt_number=f"PH15-{state}",
        )

    def test_capabilities_are_participant_scoped(self):
        self.assertEqual(self.capabilities_for(self.outsider), [])
        participant_payload = self.capabilities_for(self.client_user)
        self.assertEqual(len(participant_payload), 1)
        self.assertEqual(participant_payload[0]["booking_id"], str(self.booking.id))

    def test_start_work_is_hidden_until_sabipay_is_funded(self):
        payload = self.capabilities_for(self.client_user)[0]
        self.assertNotIn(BookingRequest.Status.IN_PROGRESS, payload["available_status_transitions"])
        self.assertIsNone(payload["payment_state"])

        self.transaction(Transaction.State.FUNDED)
        payload = self.capabilities_for(self.client_user)[0]
        self.assertIn(BookingRequest.Status.IN_PROGRESS, payload["available_status_transitions"])
        self.assertEqual(payload["payment_state"], Transaction.State.FUNDED)

    def test_completion_is_hidden_until_funded_work_is_in_progress(self):
        transaction = self.transaction(Transaction.State.FUNDED)
        self.booking.status = BookingRequest.Status.IN_PROGRESS
        self.booking.save(update_fields=["status", "updated_at"])
        transaction.refresh_from_db()
        self.assertEqual(transaction.state, Transaction.State.IN_PROGRESS)

        payload = self.capabilities_for(self.professional_user)[0]
        self.assertIn(BookingRequest.Status.COMPLETED, payload["available_status_transitions"])
        self.assertEqual(payload["payment_state"], Transaction.State.IN_PROGRESS)

    def test_only_other_participant_can_respond_to_active_schedule(self):
        proposal = ScheduleProposal.objects.create(
            booking=self.booking,
            proposer=self.client_user.profile,
            proposed_for=timezone.now() + timedelta(days=2),
            timezone="Europe/London",
            note="Morning visit",
        )
        client_payload = self.capabilities_for(self.client_user)[0]
        professional_payload = self.capabilities_for(self.professional_user)[0]
        self.assertEqual(client_payload["active_schedule_proposal_id"], str(proposal.id))
        self.assertFalse(client_payload["can_respond_to_active_schedule"])
        self.assertTrue(professional_payload["can_respond_to_active_schedule"])
        self.assertTrue(client_payload["can_propose_schedule"])
        self.assertTrue(professional_payload["can_propose_schedule"])
