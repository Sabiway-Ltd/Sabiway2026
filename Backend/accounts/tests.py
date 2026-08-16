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
    }

    @patch("accounts.serializers.send_resend_email")
    def test_signup_confirmation_persists_role_and_login_returns_it(self, send_email):
        signup = self.client.post(reverse("signup"), self.signup_payload, format="json")
        self.assertEqual(signup.status_code, status.HTTP_201_CREATED)
        pending = PendingSignup.objects.get(email=self.signup_payload["email"])
        self.assertEqual(pending.role, User.Role.PROFESSIONAL)

        with patch("accounts.views.send_resend_email"):
            confirmation = self.client.get(reverse("confirm-signup", args=[pending.token]))
        self.assertEqual(confirmation.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email=self.signup_payload["email"])
        self.assertEqual(user.role, User.Role.PROFESSIONAL)

        login = self.client.post(
            reverse("login"),
            {"email": self.signup_payload["email"], "password": self.signup_payload["password"]},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.data["user"]["role"], User.Role.PROFESSIONAL)
        send_email.assert_called_once()

    def test_signup_rejects_unknown_role(self):
        payload = {**self.signup_payload, "role": "administrator"}
        response = self.client.post(reverse("signup"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)

    @patch("accounts.serializers.send_resend_email")
    def test_forgot_password_does_not_reveal_unknown_accounts(self, send_email):
        response = self.client.post(
            reverse("forgot-password"), {"email": "missing@example.com"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PasswordReset.objects.count(), 0)
        send_email.assert_not_called()

    def test_admin_user_endpoint_is_not_available_to_regular_users(self):
        user = User.objects.create_user(
            email="client@example.com", full_name="Client", password="StrongPass123!"
        )
        self.client.force_authenticate(user)
        response = self.client.get(reverse("user-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
