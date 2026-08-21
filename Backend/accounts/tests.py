from urllib.parse import parse_qs, urlparse
from unittest.mock import patch

from django.core import signing
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from profiles.models import Profile

from .models import PasswordReset, PendingSignup, User
from .views import GOOGLE_STATE_SALT, GoogleLoginView


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
    def test_signup_confirmation_activates_account_without_completing_onboarding(self, send_email):
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
        self.assertIsNone(user.onboarding_completed_at)

        login = self.client.post(
            reverse("login"),
            {"email": self.signup_payload["email"], "password": self.signup_payload["password"]},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.data["user"]["role"], User.Role.PROFESSIONAL)
        self.assertEqual(login.data["user"]["phone_number"], "+2348012345678")
        self.assertFalse(login.data["user"]["onboarding_complete"])
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
    def test_new_google_user_requires_role_terms_and_starts_incomplete(self, verify_google):
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
        self.assertIsNone(created.onboarding_completed_at)
        self.assertFalse(allowed.data["user"]["onboarding_complete"])
        self.assertIn("access", allowed.data)

    def test_google_signup_state_is_signed_and_tampering_is_rejected(self):
        response = self.client.get(
            reverse("generate-google-url"),
            {"intent": "signup", "role": User.Role.CLIENT, "terms_accepted": "true"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        state = parse_qs(urlparse(response.json()["auth_url"]).query)["state"][0]
        decoded = signing.loads(state, salt=GOOGLE_STATE_SALT, max_age=600)
        self.assertEqual(decoded["intent"], "signup")
        self.assertEqual(decoded["role"], User.Role.CLIENT)
        self.assertTrue(decoded["terms_accepted"])
        self.assertEqual(GoogleLoginView._read_signed_state(f"{state}tampered"), {})

    def test_client_onboarding_requires_authentication(self):
        response = self.client.post(
            reverse("client-onboarding"),
            {"full_name": "Client Person", "country": "United Kingdom"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_professional_cannot_use_client_onboarding(self):
        user = User.objects.create_user(
            email="professional@example.com",
            full_name="Professional User",
            password="StrongPass123!",
            role=User.Role.PROFESSIONAL,
        )
        self.client.force_authenticate(user)
        response = self.client.post(
            reverse("client-onboarding"),
            {"full_name": "Professional User", "country": "Nigeria"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        user.refresh_from_db()
        self.assertIsNone(user.onboarding_completed_at)

    def test_client_onboarding_updates_existing_profile_and_completion(self):
        user = User.objects.create_user(
            email="client-onboarding@example.com",
            full_name="Client User",
            password="StrongPass123!",
            role=User.Role.CLIENT,
        )
        profile = Profile.objects.get(user=user)
        self.client.force_authenticate(user)

        before = self.client.get(reverse("client-onboarding"))
        self.assertEqual(before.status_code, status.HTTP_200_OK)
        self.assertFalse(before.data["user"]["onboarding_complete"])

        response = self.client.post(
            reverse("client-onboarding"),
            {
                "full_name": "Client Person",
                "phone_number": "+447700900123",
                "country": "United Kingdom",
                "state": "Lancashire",
                "area": "Preston",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        profile.refresh_from_db()
        self.assertEqual(user.full_name, "Client Person")
        self.assertEqual(user.phone_number, "+447700900123")
        self.assertIsNotNone(user.onboarding_completed_at)
        self.assertEqual(profile.country, "United Kingdom")
        self.assertEqual(profile.state, "Lancashire")
        self.assertEqual(profile.area, "Preston")
        self.assertTrue(response.data["user"]["onboarding_complete"])
        self.assertTrue(response.data["profile"]["onboarding_complete"])

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
