from rest_framework import serializers

from .models import FxQuote, UserLocationPreference
from .catalog import normalise_country


class UserLocationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLocationPreference
        fields = [
            "country_code", "country_name", "state", "city", "area", "postal_code",
            "latitude", "longitude", "use_for_default_search", "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate(self, attrs):
        country_input = attrs.get("country_code") or attrs.get("country_name")
        if country_input:
            code, name = normalise_country(country_input)
            if code:
                attrs["country_code"] = code
            if name:
                attrs["country_name"] = name
        latitude = attrs.get("latitude")
        longitude = attrs.get("longitude")
        if (latitude is None) != (longitude is None):
            raise serializers.ValidationError("Latitude and longitude must be provided together.")
        return attrs


class FxQuoteRequestSerializer(serializers.Serializer):
    service_amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0.01)
    service_currency = serializers.CharField(min_length=3, max_length=3)
    payment_currency = serializers.CharField(min_length=3, max_length=3)
    payout_currency = serializers.CharField(min_length=3, max_length=3, required=False)
    booking_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        for field in ("service_currency", "payment_currency", "payout_currency"):
            if field in attrs:
                value = attrs[field].strip().upper()
                if not value.isalpha():
                    raise serializers.ValidationError({field: "Use a valid three-letter currency code."})
                attrs[field] = value
        return attrs


class FxQuoteSerializer(serializers.ModelSerializer):
    is_usable = serializers.BooleanField(read_only=True)

    class Meta:
        model = FxQuote
        fields = [
            "id", "service_amount", "service_currency", "payment_amount", "payment_currency",
            "payout_amount", "payout_currency", "fx_rate", "fx_fee", "provider",
            "quoted_at", "expires_at", "status", "is_usable",
        ]
