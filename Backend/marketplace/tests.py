from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User

from .models import JobPosting, JobResponse, ServiceCategory, ServiceListing, ServiceSubcategory


class MarketplaceJourneyTests(TestCase):
    def setUp(self):
        self.provider_user = User.objects.create_user(email="provider@example.com", full_name="Provider User", password="StrongPassword123!")
        self.provider_two_user = User.objects.create_user(email="provider2@example.com", full_name="Provider Two", password="StrongPassword123!")
        self.client_user = User.objects.create_user(email="client@example.com", full_name="Client User", password="StrongPassword123!")
        self.other_client_user = User.objects.create_user(email="other@example.com", full_name="Other Client", password="StrongPassword123!")

        self.provider = self.provider_user.profile
        self.provider.role = "professional"
        self.provider.country = "Nigeria"
        self.provider.state = "Lagos"
        self.provider.save()
        self.provider_two = self.provider_two_user.profile
        self.provider_two.role = "professional"
        self.provider_two.save()
        self.client_profile = self.client_user.profile
        self.client_profile.role = "client"
        self.client_profile.save()
        self.other_client = self.other_client_user.profile
        self.other_client.role = "client"
        self.other_client.save()

        self.category = ServiceCategory.objects.get(name="Electricians")
        self.subcategory = ServiceSubcategory.objects.create(category=self.category, name="Home Electrical Repairs")
        self.listing = ServiceListing.objects.create(
            provider=self.provider,
            category=self.category,
            subcategory=self.subcategory,
            title="Home electrical repairs",
            description="Fault finding and domestic electrical repairs.",
            price_from="15000.00",
            country="Nigeria",
            state="Lagos",
            city="Ikeja",
            area="Allen",
            available_now=True,
            moderation_status=ServiceListing.ModerationStatus.APPROVED,
        )
        self.client = APIClient()

    def payload(self, response):
        return response.data["results"] if isinstance(response.data, dict) and "results" in response.data else response.data

    def test_direct_discovery_searches_problem_category_and_city(self):
        response = self.client.get("/api/marketplace/listings/?q=electrical&city=Ikeja&category=electricians&available_now=true")
        self.assertEqual(response.status_code, 200)
        data = self.payload(response)
        self.assertEqual(len(data), 1)
        self.assertEqual(str(data[0]["id"]), str(self.listing.id))
        self.assertEqual(data[0]["subcategory"]["name"], "Home Electrical Repairs")
        self.assertNotIn("email", data[0]["provider"])
        self.assertNotIn("phone_number", data[0]["provider"])
        self.assertNotIn("street", data[0]["provider"])

    def test_unapproved_listing_is_not_public_and_professional_submission_returns_to_review(self):
        pending = ServiceListing.objects.create(
            provider=self.provider_two,
            category=self.category,
            title="Pending service",
            description="Not public yet",
            price_from="5000.00",
        )
        public = self.client.get("/api/marketplace/listings/")
        self.assertNotIn(str(pending.id), [str(item["id"]) for item in self.payload(public)])

        self.client.force_authenticate(self.provider_user)
        created = self.client.post(
            "/api/marketplace/listings/",
            {"category_id": self.category.id, "subcategory_id": self.subcategory.id, "title": "Generator diagnostics", "description": "Generator diagnostics and repair", "price_from": "20000.00", "city": "Ikeja"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["moderation_status"], ServiceListing.ModerationStatus.PENDING)

        self.listing.moderation_status = ServiceListing.ModerationStatus.APPROVED
        self.listing.save(update_fields=["moderation_status"])
        edited = self.client.patch(f"/api/marketplace/listings/{self.listing.id}/", {"price_from": "17500.00"}, format="json")
        self.assertEqual(edited.status_code, 200)
        self.assertEqual(edited.data["moderation_status"], ServiceListing.ModerationStatus.PENDING)

    def test_client_job_to_professional_response_journey(self):
        self.client.force_authenticate(self.client_user)
        created = self.client.post(
            "/api/marketplace/jobs/",
            {"category_id": self.category.id, "subcategory_id": self.subcategory.id, "title": "Fix faulty sockets", "description": "Three sockets are no longer working", "budget_min": "10000", "budget_max": "30000", "country": "Nigeria", "state": "Lagos", "city": "Ikeja"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        job = JobPosting.objects.get(id=created.data["id"])
        self.assertEqual(job.moderation_status, JobPosting.ModerationStatus.PENDING)

        public_before_approval = self.client.get("/api/marketplace/jobs/?city=Ikeja")
        self.assertNotIn(str(job.id), [str(item["id"]) for item in self.payload(public_before_approval)])

        job.moderation_status = JobPosting.ModerationStatus.APPROVED
        job.save(update_fields=["moderation_status"])
        self.client.force_authenticate(self.provider_user)
        response = self.client.post(
            "/api/marketplace/job-responses/",
            {"job_id": str(job.id), "message": "I can inspect and repair the sockets tomorrow.", "proposed_price": "18000"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        job_response = JobResponse.objects.get(id=response.data["id"])
        self.assertEqual(job_response.professional, self.provider)

        duplicate = self.client.post(
            "/api/marketplace/job-responses/",
            {"job_id": str(job.id), "message": "Another response"},
            format="json",
        )
        self.assertEqual(duplicate.status_code, 400)

        self.client.force_authenticate(self.client_user)
        decision = self.client.post(f"/api/marketplace/job-responses/{job_response.id}/decision/", {"status": "shortlisted"}, format="json")
        self.assertEqual(decision.status_code, 200)
        job_response.refresh_from_db()
        self.assertEqual(job_response.status, JobResponse.Status.SHORTLISTED)

    def test_role_and_ownership_boundaries(self):
        self.client.force_authenticate(self.provider_user)
        cannot_post_job = self.client.post(
            "/api/marketplace/jobs/",
            {"category_id": self.category.id, "title": "Not allowed", "description": "x"},
            format="json",
        )
        self.assertEqual(cannot_post_job.status_code, 403)

        self.client.force_authenticate(self.client_user)
        cannot_list = self.client.post(
            "/api/marketplace/listings/",
            {"category_id": self.category.id, "title": "Not allowed", "description": "x", "price_from": "1000"},
            format="json",
        )
        self.assertEqual(cannot_list.status_code, 403)

        job = JobPosting.objects.create(client=self.client_profile, category=self.category, title="Owner job", description="test", moderation_status=JobPosting.ModerationStatus.APPROVED)
        self.client.force_authenticate(self.other_client_user)
        forbidden = self.client.patch(f"/api/marketplace/jobs/{job.id}/", {"title": "Hijacked"}, format="json")
        self.assertEqual(forbidden.status_code, 403)
