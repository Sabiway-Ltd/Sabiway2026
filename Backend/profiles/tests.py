from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from profiles.models import Profile


class ProfileTrustBoundaryTests(APITestCase):
    def setUp(self):
        self.professional = User.objects.create_user(
            email="pro@example.com",
            full_name="Trusted Professional",
            password="StrongPass123!",
            role=User.Role.PROFESSIONAL,
        )
        self.viewer = User.objects.create_user(
            email="viewer@example.com",
            full_name="Profile Viewer",
            password="StrongPass123!",
            role=User.Role.CLIENT,
        )
        profile = self.professional.profile
        profile.phone_number = "+2348012345678"
        profile.gender = "other"
        profile.country = "Nigeria"
        profile.state = "Lagos"
        profile.area = "Ikeja"
        profile.street = "Private Street"
        profile.save()

        # Simulate historical database drift without triggering model signals.
        Profile.objects.filter(pk=profile.pk).update(role=User.Role.CLIENT)

    def test_account_role_is_authoritative_even_when_legacy_profile_role_drifted(self):
        self.client.force_authenticate(self.professional)
        response = self.client.get("/api/profiles/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], User.Role.PROFESSIONAL)

    def test_saving_account_repairs_legacy_profile_role_mirror(self):
        self.professional.save(update_fields=["role"])
        self.professional.profile.refresh_from_db()
        self.assertEqual(self.professional.profile.role, User.Role.PROFESSIONAL)

    def test_profile_save_cannot_reintroduce_role_drift(self):
        profile = self.professional.profile
        profile.refresh_from_db()
        profile.role = User.Role.CLIENT
        profile.bio = "Safe profile edit"
        profile.save()
        profile.refresh_from_db()
        self.assertEqual(profile.role, User.Role.PROFESSIONAL)

    def test_profile_update_cannot_change_authoritative_account_role(self):
        self.client.force_authenticate(self.professional)
        response = self.client.patch(
            "/api/profiles/me/",
            {"role": User.Role.CLIENT, "bio": "Updated safely"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.professional.refresh_from_db()
        self.assertEqual(self.professional.role, User.Role.PROFESSIONAL)
        self.assertEqual(response.data["role"], User.Role.PROFESSIONAL)

    def test_profile_name_edit_updates_authoritative_account_and_mirror(self):
        self.client.force_authenticate(self.professional)
        response = self.client.patch(
            "/api/profiles/me/",
            {"full_name": "Updated Professional"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.professional.refresh_from_db()
        self.professional.profile.refresh_from_db()
        self.assertEqual(self.professional.full_name, "Updated Professional")
        self.assertEqual(self.professional.profile.full_name, "Updated Professional")
        self.assertEqual(response.data["full_name"], "Updated Professional")

    def test_direct_profile_save_cannot_reintroduce_name_drift(self):
        profile = self.professional.profile
        profile.full_name = "Drifted Profile Name"
        profile.save()
        profile.refresh_from_db()
        self.assertEqual(profile.full_name, self.professional.full_name)

    def test_owner_can_see_private_profile_fields(self):
        self.client.force_authenticate(self.professional)
        response = self.client.get("/api/profiles/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.professional.email)
        self.assertEqual(response.data["phone_number"], "+2348012345678")
        self.assertIn("street", response.data)
        self.assertIn("address", response.data)

    def test_other_user_receives_only_public_profile_fields(self):
        self.client.force_authenticate(self.viewer)
        response = self.client.get(f"/api/profiles/{self.professional.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for private_field in ("email", "phone_number", "gender", "date_of_birth", "area", "street", "address"):
            self.assertNotIn(private_field, response.data)
        self.assertEqual(response.data["role"], User.Role.PROFESSIONAL)
        self.assertIn(response.data["verification_status"], {"approved", "unverified"})
