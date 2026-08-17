from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import PasswordReset, PendingSignup, User


class IdentityJourneyTests(APITestCase):
    signup_payload = {
        "full_name": "Sabi Way",
        "email": "sabi@example.com",
        "password": "StrongPass123!",
        "role": User.Role.PROFESSIONAL,
        "phone_number": "0801 234 5678",
        "terms_accepted": True,
    }

    @patch("accounts.serializers.send_resend_email")
    def test_signup_confirmation_persists_identity_role_phone_terms_and_onboarding(self, send_email):
        signup = self.client.post(reverse("signup"), self.signup_payload, format="json")
        self.assertEqual(signup.status_code, status.HTTP_201_CREATED)
        pending = PendingSignup.objects.get(email=self.signup_payload["email"])
        self.assertEqual(pending.role, User.Role.PROFESSIONAL)
        self.assertEqual(pending.phone_number, "+2348012345678")
        self.assertIsNotNone(pending.terms_accepted_at)

        with patch("accounts.views.send_resend_email"):
            confirmation = self.client.get(reverse("confirm-signup", args=[pending.token]))
        self.assertEqual(confirmation.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email=self.signup_payload["email"])
        self.assertEqual(user.role, User.Role.PROFESSIONAL)
        self.assertEqual(user.phone_number, "+2348012345678")
        self.assertIsNotNone(user.terms_accepted_at)
        self.assertIsNotNone(user.onboarding_completed_at)

        login = self.client.post(
            reverse("login"),
            {"email": self.signup_payload["email"], "password": self.signup_payload["password"]},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.data["user"]["role"], User.Role.PROFESSIONAL)
        self.assertEqual(login.data["user"]["phone_number"], "+2348012345678")
        self.assertTrue(login.data["user"]["onboarding_complete"])
        send_email.assert_called_once()

    def test_signup_rejects_unknown_role(self):
        payload = {**self.signup_payload, "role": "administrator"}
        response = self.client.post(reverse("signup"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)

    def test_signup_requires_explicit_terms_acceptance(self):
        payload = {**self.signup_payload, "email": "terms@example.com", "terms_accepted": False}
        response = self.client.post(reverse("signup"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("terms_accepted", response.data)
        self.assertFalse(PendingSignup.objects.filter(email="terms@example.com").exists())

    def test_signup_rejects_invalid_nigerian_phone(self):
        payload = {**self.signup_payload, "email": "phone@example.com", "phone_number": "12345"}
        response = self.client.post(reverse("signup"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.data)

    def test_suspended_account_cannot_receive_session(self):
        user = User.objects.create_user(
            email="suspended@example.com",
            full_name="Suspended User",
            password="StrongPass123!",
            is_active=False,
        )
        response = self.client.post(
            reverse("login"),
            {"email": user.email, "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("access", response.data)

    @patch("accounts.serializers.id_token.verify_oauth2_token")
    def test_new_google_user_cannot_bypass_role_and_terms(self, verify_google):
        verify_google.return_value = {
            "iss": "https://accounts.google.com",
            "email": "google-new@example.com",
            "name": "Google New",
        }
        blocked = self.client.post(reverse("google-login"), {"token": "valid-google-token"}, format="json")
        self.assertEqual(blocked.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(blocked.data["onboarding_required"])
        self.assertFalse(User.objects.filter(email="google-new@example.com").exists())

        allowed = self.client.post(
            reverse("google-login"),
            {
                "token": "valid-google-token",
                "role": User.Role.CLIENT,
                "phone_number": "+2348012345678",
                "terms_accepted": True,
            },
            format="json",
        )
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        created = User.objects.get(email="google-new@example.com")
        self.assertEqual(created.role, User.Role.CLIENT)
        self.assertIsNotNone(created.onboarding_completed_at)
        self.assertIn("access", allowed.data)

    @patch("accounts.serializers.send_resend_email")
    def test_forgot_password_does_not_reveal_unknown_accounts(self, send_email):
        response = self.client.post(reverse("forgot-password"), {"email": "missing@example.com"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PasswordReset.objects.count(), 0)
        send_email.assert_not_called()

    def test_admin_user_endpoint_is_not_available_to_regular_users(self):
        user = User.objects.create_user(email="client@example.com", full_name="Client", password="StrongPass123!")
        self.client.force_authenticate(user)
        response = self.client.get(reverse("user-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
