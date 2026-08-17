from django.test import TestCase
from rest_framework import status

from sabiway.api import error_response, success_response


class HealthFoundationTests(TestCase):
    def test_legacy_health_route_remains_available(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "healthy")

    def test_versioned_health_route_is_available(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["database"], "ok")

    def test_success_response_uses_v2_envelope(self):
        response = success_response({"id": 1}, meta={"request_id": "test"})
        self.assertEqual(response.data, {"data": {"id": 1}, "meta": {"request_id": "test"}})

    def test_error_response_uses_v2_envelope(self):
        response = error_response("invalid_request", "Check the submitted data.", details={"field": "required"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {
                "error": {
                    "code": "invalid_request",
                    "message": "Check the submitted data.",
                    "details": {"field": "required"},
                }
            },
        )
