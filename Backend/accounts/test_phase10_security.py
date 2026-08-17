from datetime import timedelta
from django.conf import settings
from django.test import TestCase
from django.utils import timezone
from accounts.models import User
from accounts.views import GoogleLoginView
from sabiway.throttles import SabiWayRateThrottle

class Phase10AuthenticationSecurityTests(TestCase):
    def test_token_lifetimes_are_bounded(self):
        self.assertLessEqual(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"], timedelta(hours=1))
        self.assertLessEqual(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"], timedelta(days=30))
        self.assertTrue(settings.SIMPLE_JWT["ROTATE_REFRESH_TOKENS"])
        self.assertTrue(settings.SIMPLE_JWT["BLACKLIST_AFTER_ROTATION"])

    def test_google_redirect_keeps_jwts_out_of_query_string(self):
        user = User.objects.create_user(email="oauth@example.com", full_name="OAuth User", password="StrongPassword123!", onboarding_completed_at=timezone.now())
        response = GoogleLoginView()._handle_user(user.email, user.full_name, from_redirect=True)
        location = response["Location"]
        self.assertIn("/callback#", location)
        self.assertIn("access=", location)
        self.assertIn("refresh=", location)
        self.assertNotIn("?access=", location)

    def test_sensitive_route_scopes(self):
        throttle = SabiWayRateThrottle()
        class Request:
            user = None
            data = {}
            def __init__(self, path): self.path = path
        self.assertEqual(throttle._scope_for(Request("/api/auth/login/")), "login")
        self.assertEqual(throttle._scope_for(Request("/api/auth/forgot-password/")), "password_reset")
        self.assertEqual(throttle._scope_for(Request("/api/auth/token/refresh/")), "token_refresh")
