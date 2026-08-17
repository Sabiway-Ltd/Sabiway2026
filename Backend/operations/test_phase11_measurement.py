from datetime import timedelta
from io import StringIO

from django.contrib.auth.models import Group, Permission
from django.core.management import call_command
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from operations.analytics import measurement_snapshot, record_product_event, record_technical_metric
from operations.middleware import normalise_route
from operations.models import ProductEvent, TechnicalMetric
from operations.roles import sync_operational_roles


@override_settings(
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
        "DEFAULT_THROTTLE_CLASSES": (),
    }
)
class Phase11MeasurementTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="measure@example.com", full_name="Measure User", password="StrongPassword123!")
        self.staff = User.objects.create_user(email="staff-measure@example.com", full_name="Measure Staff", password="StrongPassword123!", is_staff=True)

    def test_client_event_is_accepted_and_privacy_fields_are_dropped(self):
        raw_anon = "raw-browser-session-123"
        response = self.client.post("/api/operations/events/", {"event_name":"screen_viewed","source":"web","anonymous_id":raw_anon,"properties":{"route":"/marketplace","email":"private@example.com","message":"private message body","query":"private search text"}}, format="json")
        self.assertEqual(response.status_code, 202)
        event = ProductEvent.objects.get(event_name="screen_viewed")
        self.assertTrue(event.anonymous_id_hash)
        self.assertNotEqual(event.anonymous_id_hash, raw_anon)
        self.assertEqual(event.properties, {"route": "/marketplace"})
        self.assertNotIn("private@example.com", str(event.properties))
        self.assertNotIn("private search text", str(event.properties))

    def test_ingest_rejects_invalid_name_and_backend_source_spoofing(self):
        self.assertEqual(self.client.post("/api/operations/events/", {"event_name":"Bad Event!","source":"web"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/operations/events/", {"event_name":"screen_viewed","source":"backend"}, format="json").status_code, 400)

    def test_measurement_snapshot_requires_measurement_permission(self):
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.get("/api/operations/measurement/").status_code, 403)
        permission = Permission.objects.get(content_type__app_label="operations", codename="view_product_measurement")
        self.staff.user_permissions.add(permission)
        allowed = self.client.get("/api/operations/measurement/?hours=24")
        self.assertEqual(allowed.status_code, 200)
        self.assertIn("api_error_rate", allowed.data)
        self.assertIn("retention_7d", allowed.data)

    def test_snapshot_calculates_funnels_and_failure_rates(self):
        ProductEvent.objects.all().delete()
        TechnicalMetric.objects.all().delete()
        record_product_event("registration_started")
        record_product_event("registration_completed", actor=self.user)
        record_product_event("transaction_started", actor=self.user)
        record_product_event("transaction_completed", actor=self.user)
        record_product_event("engagement_created", actor=self.user, properties={"category": "like"})
        record_technical_metric("api_request", route="/api/example/", status_code=200, latency_ms=100)
        record_technical_metric("api_request", route="/api/example/", status_code=500, latency_ms=300, success=False)
        snapshot = measurement_snapshot(hours=24)
        self.assertEqual(snapshot["registration_conversion"], 1.0)
        self.assertEqual(snapshot["transaction_conversion"], 1.0)
        self.assertEqual(snapshot["engagement_events"], 1)
        self.assertEqual(snapshot["api_error_rate"], 0.5)
        self.assertEqual(snapshot["api_avg_latency_ms"], 200.0)

    def test_route_normalisation_removes_record_identifiers_and_query_is_never_used(self):
        route = normalise_route("/api/marketplace/bookings/123/550e8400-e29b-41d4-a716-446655440000/")
        self.assertNotIn("123", route)
        self.assertNotIn("550e8400", route)
        self.assertIn(":id", route)

    def test_search_measurement_records_length_not_query_text(self):
        query = "sensitive-search-term"
        response = self.client.get("/api/search/", {"q": query, "type": "profiles"})
        self.assertEqual(response.status_code, 200)
        event = ProductEvent.objects.filter(event_name="search_performed").latest("created_at")
        self.assertEqual(event.properties["query_length"], len(query))
        self.assertIn("result_count", event.properties)
        self.assertNotIn(query, str(event.properties))

    @override_settings(PRODUCT_EVENT_RETENTION_DAYS=30, TECHNICAL_METRIC_RETENTION_DAYS=7)
    def test_retention_cleanup_deletes_only_expired_measurement(self):
        old_event = record_product_event("screen_viewed", actor=self.user, properties={"screen":"home"})
        fresh_event = record_product_event("screen_viewed", actor=self.user, properties={"screen":"marketplace"})
        old_metric = record_technical_metric("api_request", route="/api/old/", status_code=200)
        fresh_metric = record_technical_metric("api_request", route="/api/fresh/", status_code=200)
        ProductEvent.objects.filter(pk=old_event.pk).update(created_at=timezone.now()-timedelta(days=31))
        TechnicalMetric.objects.filter(pk=old_metric.pk).update(created_at=timezone.now()-timedelta(days=8))
        call_command("purge_measurement", stdout=StringIO())
        self.assertFalse(ProductEvent.objects.filter(pk=old_event.pk).exists())
        self.assertTrue(ProductEvent.objects.filter(pk=fresh_event.pk).exists())
        self.assertFalse(TechnicalMetric.objects.filter(pk=old_metric.pk).exists())
        self.assertTrue(TechnicalMetric.objects.filter(pk=fresh_metric.pk).exists())

    def test_read_only_analyst_gets_measurement_views_not_mutation_permissions(self):
        sync_operational_roles()
        analyst = Group.objects.get(name="Read-only Analyst")
        self.assertTrue(analyst.permissions.filter(content_type__app_label="operations", codename="view_product_measurement").exists())
        self.assertTrue(analyst.permissions.filter(content_type__app_label="operations", codename="view_productevent").exists())
        self.assertFalse(analyst.permissions.filter(content_type__app_label="operations", codename="add_productevent").exists())
        self.assertFalse(analyst.permissions.filter(content_type__app_label="operations", codename="change_technicalmetric").exists())
