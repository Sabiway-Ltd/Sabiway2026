from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from marketplace.models import BookingRequest, MessageThread
from sabipay.models import Transaction
from verification.models import VerificationSubmission

from .models import ProfessionalReview


class ProfessionalReviewAuthorityTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="review-client@example.com",
            full_name="Review Client",
            password="StrongPass123!",
            role=User.Role.CLIENT,
        )
        self.professional_user = User.objects.create_user(
            email="review-pro@example.com",
            full_name="Review Professional",
            password="StrongPass123!",
            role=User.Role.PROFESSIONAL,
        )
        self.other_client = User.objects.create_user(
            email="other-client@example.com",
            full_name="Other Client",
            password="StrongPass123!",
            role=User.Role.CLIENT,
        )
        self.professional_user.profile.username = "@review-professional"
        self.professional_user.profile.save()
        self.verification = VerificationSubmission.objects.create(
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
            scope_summary="Completed SabiWay work",
            agreed_price="100.00",
            currency="GBP",
            status=BookingRequest.Status.ACCEPTED,
        )
        self.transaction = Transaction.objects.create(
            booking=self.booking,
            client=self.client_user.profile,
            professional=self.professional_user.profile,
            amount=Decimal("100.00"),
            currency="GBP",
            commission_rate=Decimal("0.1000"),
            commission_amount=Decimal("10.00"),
            provider_amount=Decimal("90.00"),
            state=Transaction.State.FUNDED,
            payment_status=Transaction.PaymentStatus.SUCCEEDED,
            receipt_number=f"REVIEW-{self.booking.id}",
        )

    def complete_booking(self):
        self.booking.status = BookingRequest.Status.IN_PROGRESS
        self.booking.save(update_fields=["status", "updated_at"])
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.state, Transaction.State.IN_PROGRESS)
        self.booking.status = BookingRequest.Status.COMPLETED
        self.booking.save(update_fields=["status", "updated_at"])
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.state, Transaction.State.DELIVERED)

    def review_payload(self, **overrides):
        payload = {
            "booking_id": str(self.booking.id),
            "rating": 5,
            "comment": "Delivered the agreed work clearly and professionally.",
        }
        payload.update(overrides)
        return payload

    def test_review_requires_completed_booking(self):
        self.client.force_authenticate(self.client_user)
        response = self.client.post("/api/reputation/reviews/", self.review_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ProfessionalReview.objects.count(), 0)

    def test_only_booking_client_can_review(self):
        self.complete_booking()
        self.client.force_authenticate(self.other_client)
        response = self.client.post("/api/reputation/reviews/", self.review_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ProfessionalReview.objects.count(), 0)

    def test_completed_booking_allows_one_review(self):
        self.complete_booking()
        self.client.force_authenticate(self.client_user)
        first = self.client.post("/api/reputation/reviews/", self.review_payload(), format="json")
        second = self.client.post("/api/reputation/reviews/", self.review_payload(rating=4), format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ProfessionalReview.objects.count(), 1)
        review = ProfessionalReview.objects.get()
        self.assertEqual(review.client, self.client_user.profile)
        self.assertEqual(review.professional, self.professional_user.profile)

    def test_rating_must_be_between_one_and_five(self):
        self.complete_booking()
        self.client.force_authenticate(self.client_user)
        response = self.client.post("/api/reputation/reviews/", self.review_payload(rating=6), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ProfessionalReview.objects.count(), 0)

    def test_public_profile_exposes_only_approved_verification_and_reputation(self):
        self.complete_booking()
        ProfessionalReview.objects.create(
            booking=self.booking,
            client=self.client_user.profile,
            professional=self.professional_user.profile,
            rating=5,
            comment="Strong completed-work experience.",
        )
        self.verification.decision_reason = "Private reviewer reasoning"
        self.verification.more_info_request = "Private request"
        self.verification.save(update_fields=["decision_reason", "more_info_request", "updated_at"])
        response = self.client.get("/api/profiles/public/review-professional/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["trust"]["verification"]["is_verified"])
        reputation = response.data["trust"]["reputation"]
        self.assertEqual(reputation["average_rating"], 5.0)
        self.assertEqual(reputation["review_count"], 1)
        self.assertEqual(reputation["reviews"][0]["comment"], "Strong completed-work experience.")
        body = str(response.data)
        self.assertNotIn(self.verification.decision_reason, body)
        self.assertNotIn(self.verification.more_info_request, body)
