from decimal import Decimal

from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from marketplace.models import BookingRequest, ServiceListing

from .catalog import public_markets
from .models import ListingServiceArea
from .serializers import (
    FxQuoteRequestSerializer,
    FxQuoteSerializer,
    ListingServiceAreaSerializer,
    UserLocationPreferenceSerializer,
)
from .services import create_fx_quote, nearby_service_areas, preference_for_profile


class MarketListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "focus_markets": ["NG", "GB"],
            "markets": public_markets(),
            "model": "global_location_based_marketplace",
            "note": "Nigeria and the UK are the initial optimised markets. Other countries remain discoverable where supply exists.",
        })


class LocationPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        preference = preference_for_profile(request.user.profile)
        return Response(UserLocationPreferenceSerializer(preference).data)

    def put(self, request):
        preference = preference_for_profile(request.user.profile)
        serializer = UserLocationPreferenceSerializer(preference, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ListingServiceAreaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _listing(self, request, listing_id):
        return get_object_or_404(
            ServiceListing.objects.filter(provider=request.user.profile),
            pk=listing_id,
        )

    def get(self, request, listing_id):
        listing = self._listing(request, listing_id)
        area, _ = ListingServiceArea.objects.get_or_create(
            listing=listing,
            defaults={
                "country_name": listing.country,
                "state": listing.state,
                "city": listing.city,
                "area": listing.area,
            },
        )
        return Response(ListingServiceAreaSerializer(area).data)

    def put(self, request, listing_id):
        listing = self._listing(request, listing_id)
        area, _ = ListingServiceArea.objects.get_or_create(
            listing=listing,
            defaults={
                "country_name": listing.country,
                "state": listing.state,
                "city": listing.city,
                "area": listing.area,
            },
        )
        serializer = ListingServiceAreaSerializer(area, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class NearbyServiceView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        latitude = request.query_params.get("lat")
        longitude = request.query_params.get("lng")
        if latitude is None or longitude is None:
            return Response({"detail": "lat and lng are required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            radius_km = float(request.query_params.get("radius_km", 25))
            areas = nearby_service_areas(
                latitude=Decimal(latitude),
                longitude=Decimal(longitude),
                radius_km=radius_km,
                country_code=request.query_params.get("country_code", ""),
            )[:100]
        except (ValueError, ArithmeticError):
            return Response({"detail": "Invalid location coordinates."}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        for area in areas:
            listing = area.listing
            results.append({
                "listing_id": str(listing.id),
                "title": listing.title,
                "provider": listing.provider.full_name,
                "country_code": area.country_code,
                "country": area.country_name,
                "state": area.state,
                "city": area.city,
                "area": area.area,
                "service_radius_km": area.service_radius_km,
                "currency": listing.currency,
                "price_from": str(listing.price_from),
                "delivery_mode": listing.delivery_mode,
            })
        return Response({"results": results, "count": len(results)})


class FxQuoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = FxQuoteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        booking = None
        if data.get("booking_id"):
            booking = get_object_or_404(
                BookingRequest.objects.filter(client=request.user.profile),
                pk=data["booking_id"],
            )
            if booking.agreed_price is not None and Decimal(booking.agreed_price) != data["service_amount"]:
                return Response({"detail": "FX quote amount must match the booking agreement."}, status=status.HTTP_400_BAD_REQUEST)
            if booking.currency.upper() != data["service_currency"]:
                return Response({"detail": "FX quote currency must match the booking agreement."}, status=status.HTTP_400_BAD_REQUEST)

        quote = create_fx_quote(
            profile=request.user.profile,
            booking=booking,
            service_amount=data["service_amount"],
            service_currency=data["service_currency"],
            payment_currency=data["payment_currency"],
            payout_currency=data.get("payout_currency"),
        )
        return Response(FxQuoteSerializer(quote).data, status=status.HTTP_201_CREATED)
