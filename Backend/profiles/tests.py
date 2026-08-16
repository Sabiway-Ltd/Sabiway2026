from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from .models import Profile
from .serializers import ProfileSerializer
from .views import ProfileDetailView

User = get_user_model()


class ProfilePhase3Tests(APITestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.professional = User.objects.create_user(
            email="professional@example.com",
            full_name="Professional User",
            password="A-strong-test-password-123!",
            role="professional",
        )
        self.client_user = User.objects.create_user(
            email="client@example.com",
            full_name="Client User",
            password="A-strong-test-password-123!",
            role="client",
        )

    def test_profile_role_is_synchronised_from_account(self):
        profile = self.professional.profile
        self.assertEqual(profile.role, "professional")

        self.professional.role = "client"
        self.professional.save(update_fields=["role"])
        profile.refresh_from_db()
        self.assertEqual(profile.role, "client")

    def test_profile_api_cannot_change_account_role(self):
        request = self.factory.patch("/api/profiles/me/", {"role": "client", "bio": "Updated"}, format="json")
        force_authenticate(request, user=self.professional)
        response = ProfileDetailView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.professional.refresh_from_db()
        self.professional.profile.refresh_from_db()
        self.assertEqual(self.professional.role, "professional")
        self.assertEqual(self.professional.profile.role, "professional")
        self.assertEqual(self.professional.profile.bio, "Updated")

    def test_public_serialization_hides_private_fields(self):
        profile = self.professional.profile
        profile.phone_number = "+2348012345678"
        profile.gender = "other"
        profile.country = "Nigeria"
        profile.state = "Lagos"
        profile.area = "Ikeja"
        profile.street = "Private Street"
        profile.save()

        request = self.factory.get(f"/api/profiles/{profile.pk}/")
        force_authenticate(request, user=self.client_user)
        data = ProfileSerializer(profile, context={"request": request}).data

        self.assertNotIn("email", data)
        self.assertNotIn("phone_number", data)
        self.assertNotIn("gender", data)
        self.assertNotIn("area", data)
        self.assertNotIn("street", data)
        self.assertNotIn("address", data)
        self.assertEqual(data["country"], "Nigeria")
        self.assertEqual(data["state"], "Lagos")

    def test_owner_can_view_private_profile_fields(self):
        profile = self.professional.profile
        profile.phone_number = "+2348012345678"
        profile.save()

        request = self.factory.get("/api/profiles/me/")
        force_authenticate(request, user=self.professional)
        data = ProfileSerializer(profile, context={"request": request}).data

        self.assertEqual(data["email"], self.professional.email)
        self.assertEqual(data["phone_number"], "+2348012345678")
        self.assertEqual(data["role"], "professional")
