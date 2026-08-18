from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import User


class InternalReviewAccessTests(APITestCase):
    endpoint = "/api/auth/internal-review-login/"

    def test_review_login_is_hidden_by_default(self):
        response = self.client.post(self.endpoint, {"role": "client"}, format="json")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(User.objects.count(), 0)

    @override_settings(DEBUG=True, INTERNAL_REVIEW_MODE=True)
    def test_review_login_creates_non_staff_client_session(self):
        response = self.client.post(self.endpoint, {"role": "client"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["review_mode"])
        self.assertTrue(response.data["access"])
        self.assertEqual(response.data["user"]["role"], "client")
        self.assertFalse(response.data["user"]["is_staff"])
        self.assertFalse(response.data["user"]["is_superuser"])

        user = User.objects.get(email="internal-review-client@review.sabiway.local")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.has_usable_password())
        self.assertIsNotNone(user.onboarding_completed_at)

    @override_settings(DEBUG=True, INTERNAL_REVIEW_MODE=True)
    def test_professional_review_session_is_role_specific(self):
        response = self.client.post(self.endpoint, {"role": "professional"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["role"], "professional")
        self.assertTrue(User.objects.filter(email="internal-review-professional@review.sabiway.local", role="professional").exists())

    @override_settings(DEBUG=True, INTERNAL_REVIEW_MODE=True)
    def test_review_login_rejects_unknown_role(self):
        response = self.client.post(self.endpoint, {"role": "admin"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.count(), 0)

    @override_settings(DEBUG=False, INTERNAL_REVIEW_MODE=True)
    def test_review_login_cannot_run_when_debug_is_false(self):
        response = self.client.post(self.endpoint, {"role": "client"}, format="json")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(User.objects.count(), 0)
