from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from marketplace.models import ServiceCategory, ServiceListing

from .models import ListingServiceArea


class MultiCountryMarketTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.professional_user = User.objects.create_user(
            email="uk-provider@example.com",
            full_name="UK Provider",
            password="StrongPassword123!",
            role=User.Role.PROFESSIONAL,
        )
        self.client_user = User.objects.create_user(
            email="uk-client@example.com",
            full_name="UK Client",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.category, _ = ServiceCategory.objects.get_or_create(name="Market Test Service")

    def test_uk_listing_is_canonicalised_and_uses_gbp(self):
        listing = ServiceListing.objects.create(
            provider=self.professional_user.profile,
            category=self.category,
            title="Manchester electrical repair",
            description="Local service",
            price_from="80.00",
            currency="NGN",
            country="UK",
            state="England",
            city="Manchester",
            area="Ancoats",
            moderation_status=ServiceListing.ModerationStatus.APPROVED,
        )
        listing.refresh_from_db()
        self.assertEqual(listing.country, "United Kingdom")
        self.assertEqual(listing.currency, "GBP")
        area = ListingServiceArea.objects.get(listing=listing)
        self.assertEqual(area.country_code, "GB")
        self.assertEqual(area.city, "Manchester")

    def test_nigeria_listing_uses_ngn(self):
        listing = ServiceListing.objects.create(
            provider=self.professional_user.profile,
            category=self.category,
            title="Lagos cleaning",
            description="Local service",
            price_from="25000.00",
            currency="GBP",
            country="Nigeria",
            state="Lagos",
            city="Ikeja",
            moderation_status=ServiceListing.ModerationStatus.APPROVED,
        )
        listing.refresh_from_db()
        self.assertEqual(listing.currency, "NGN")

    def test_market_catalog_is_public_and_declares_focus_markets(self):
        response = self.api.get("/api/markets/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["focus_markets"], ["NG", "GB"])
        self.assertEqual(response.data["model"], "global_location_based_marketplace")

    def test_location_preference_is_separate_from_account_and_service_location(self):
        self.api.force_authenticate(self.client_user)
        response = self.api.put(
            "/api/markets/location-preference/",
            {"country_code": "GB", "city": "Preston", "use_for_default_search": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["country_name"], "United Kingdom")
        self.assertEqual(response.data["city"], "Preston")

    def test_same_currency_quote_is_one_to_one(self):
        self.api.force_authenticate(self.client_user)
        response = self.api.post(
            "/api/markets/fx-quote/",
            {
                "service_amount": "100.00",
                "service_currency": "GBP",
                "payment_currency": "GBP",
                "payout_currency": "GBP",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Decimal(response.data["fx_rate"]), Decimal("1.0000000000"))
        self.assertEqual(Decimal(response.data["payment_amount"]), Decimal("100.00"))

    @override_settings(DEBUG=True, FX_PROVIDER="static", FX_STATIC_RATES='{"GBP_NGN": 2100}', FX_FEE_RATE=0)
    def test_cross_currency_quote_snapshots_configured_rate(self):
        self.api.force_authenticate(self.client_user)
        response = self.api.post(
            "/api/markets/fx-quote/",
            {
                "service_amount": "100.00",
                "service_currency": "GBP",
                "payment_currency": "NGN",
                "payout_currency": "GBP",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Decimal(response.data["payment_amount"]), Decimal("210000.00"))
        self.assertEqual(response.data["provider"], "static")

    @override_settings(DEBUG=False, FX_PROVIDER="disabled")
    def test_cross_currency_quote_fails_closed_without_provider(self):
        self.api.force_authenticate(self.client_user)
        response = self.api.post(
            "/api/markets/fx-quote/",
            {
                "service_amount": "100.00",
                "service_currency": "GBP",
                "payment_currency": "NGN",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
