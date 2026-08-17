from rest_framework import status
from rest_framework.test import APITestCase


class SearchBoundaryTests(APITestCase):
    def test_search_rejects_short_query(self):
        response = self.client.get("/api/search/", {"q": "a", "type": "posts"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("at least 2 characters", response.data["detail"])

    def test_search_rejects_unknown_type(self):
        response = self.client.get("/api/search/", {"q": "plumber", "type": "marketplace"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("posts, profiles or hashtags", response.data["detail"])

    def test_search_rejects_pathologically_large_query(self):
        response = self.client.get("/api/search/", {"q": "x" * 121, "type": "posts"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("120 characters", response.data["detail"])

    def test_search_allows_valid_empty_result(self):
        response = self.client.get("/api/search/", {"q": "no-such-sabiway-result", "type": "profiles"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
