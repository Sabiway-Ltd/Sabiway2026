from unittest.mock import patch

from django.test import TestCase


class Phase10HealthHardeningTests(TestCase):
    def test_liveness_does_not_depend_on_database(self):
        response = self.client.get("/api/health/live/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertIn("no-store", response["Cache-Control"])

    @patch("health.views.database_ready", return_value=False)
    def test_readiness_fails_closed_without_leaking_exception_details(self, _database_ready):
        response = self.client.get("/api/health/ready/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable", "database": "unavailable"})
        self.assertNotIn("detail", response.json())
        self.assertIn("no-store", response["Cache-Control"])
