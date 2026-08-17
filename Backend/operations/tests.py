from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase

from accounts.models import User

from .models import OperationsAudit, PlatformConfiguration, SupportCase
from .roles import sync_operational_roles


class Phase9OperationsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="user@example.com", full_name="User", password="StrongPassword123!")
        self.other = User.objects.create_user(email="other@example.com", full_name="Other", password="StrongPassword123!")
        self.staff = User.objects.create_user(email="support@example.com", full_name="Support", password="StrongPassword123!", is_staff=True)
        manage_support = Permission.objects.get(content_type__app_label="operations", codename="manage_support")
        self.staff.user_permissions.add(manage_support)

    def test_operational_role_groups_are_seeded_with_least_privilege_permissions(self):
        synced = sync_operational_roles()
        self.assertIn("Operations Admin", synced)
        self.assertIn("Verification Reviewer", synced)
        self.assertIn("Moderator", synced)
        self.assertIn("Support Agent", synced)
        self.assertIn("Finance Admin", synced)
        self.assertIn("Read-only Analyst", synced)
        support = Group.objects.get(name="Support Agent")
        self.assertTrue(support.permissions.filter(codename="manage_support", content_type__app_label="operations").exists())
        self.assertFalse(support.permissions.filter(codename="manage_sabipay", content_type__app_label="sabipay").exists())

    def test_user_can_create_and_only_read_own_support_cases(self):
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/operations/support-cases/", {
            "category": "account",
            "subject": "Cannot update profile",
            "description": "My profile update keeps failing after I save it.",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        SupportCase.objects.create(opened_by=self.other, category="other", subject="Other case", description="Another user's private support request.")
        listing = self.client.get("/api/operations/support-cases/")
        self.assertEqual(listing.status_code, 200)
        rows = listing.data if isinstance(listing.data, list) else listing.data["results"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(OperationsAudit.objects.filter(action="support_case_opened").count(), 1)

    def test_non_support_user_cannot_change_case_handling_fields(self):
        case = SupportCase.objects.create(opened_by=self.user, category="payment", subject="Payment pending", description="Payment is still pending after checkout.")
        self.client.force_authenticate(self.user)
        response = self.client.patch(f"/api/operations/support-cases/{case.id}/", {"status": "resolved"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_authorised_support_can_see_and_update_all_cases_with_audit(self):
        case = SupportCase.objects.create(opened_by=self.user, category="safety", subject="Safety issue", description="I need an urgent safety review for this transaction.")
        self.client.force_authenticate(self.staff)
        listing = self.client.get("/api/operations/support-cases/")
        self.assertEqual(listing.status_code, 200)
        response = self.client.patch(f"/api/operations/support-cases/{case.id}/", {"status": "in_progress", "priority": "urgent", "assigned_to": self.staff.id}, format="json")
        self.assertEqual(response.status_code, 200)
        case.refresh_from_db()
        self.assertEqual(case.priority, SupportCase.Priority.URGENT)
        self.assertEqual(case.assigned_to, self.staff)
        self.assertTrue(OperationsAudit.objects.filter(action="support_case_updated", target_id=str(case.id)).exists())

    def test_platform_configuration_rejects_secret_storage(self):
        config = PlatformConfiguration(key="PAYSTACK_SECRET_KEY", value={"value": "should-not-live-here"})
        with self.assertRaises(ValidationError):
            config.full_clean()
