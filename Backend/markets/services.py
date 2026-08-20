import json
import math
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db.models import DecimalField, ExpressionWrapper, F, Value
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .catalog import currency_for_country, market_for_country, normalise_country
from .models import FxQuote, ListingServiceArea, UserLocationPreference

MONEY = Decimal("0.01")


def money(value):
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def normalise_location(*, country="", state="", city="", area=""):
    code, name = normalise_country(country)
    return {
        "country_code": code,
        "country_name": name or (country or "").strip(),
        "state": (state or "").strip(),
        "city": (city or "").strip(),
        "area": (area or "").strip(),
    }


def suggested_currency(country, requested=""):
    return currency_for_country(country, requested=requested)


def preference_for_profile(profile):
    defaults = normalise_location(country=profile.country, state=profile.state, area=profile.area)
    preference, _ = UserLocationPreference.objects.get_or_create(
        profile=profile,
        defaults={
            **defaults,
            "city": "",
            "postal_code": "",
        },
    )
    return preference


def _distance_expression(latitude, longitude):
    # Equirectangular approximation for ordering inside a relatively small bounding box.
    lat = Decimal(str(latitude))
    lon = Decimal(str(longitude))
    lat_delta = F("latitude") - Value(lat)
    lon_delta = F("longitude") - Value(lon)
    return ExpressionWrapper(
        lat_delta * lat_delta + lon_delta * lon_delta,
        output_field=DecimalField(max_digits=24, decimal_places=12),
    )


def nearby_service_areas(*, latitude, longitude, radius_km=25, country_code=""):
    latitude = float(latitude)
    longitude = float(longitude)
    radius_km = max(1.0, min(float(radius_km), 250.0))
    lat_delta = radius_km / 111.0
    lon_scale = max(0.2, math.cos(math.radians(latitude)))
    lon_delta = radius_km / (111.0 * lon_scale)
    queryset = ListingServiceArea.objects.select_related("listing", "listing__provider__user", "listing__category").filter(
        latitude__isnull=False,
        longitude__isnull=False,
        latitude__gte=latitude - lat_delta,
        latitude__lte=latitude + lat_delta,
        longitude__gte=longitude - lon_delta,
        longitude__lte=longitude + lon_delta,
        listing__is_active=True,
        listing__moderation_status="approved",
    )
    if country_code:
        queryset = queryset.filter(country_code=country_code.upper())
    return queryset.annotate(proximity_score=_distance_expression(latitude, longitude)).order_by("proximity_score", "-listing__is_featured", "-listing__available_now")


def _configured_rates():
    raw = getattr(settings, "FX_STATIC_RATES", "") or ""
    if not raw:
        return {}
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValidationError("FX provider configuration is invalid.") from exc
    return {str(key).upper(): Decimal(str(value)) for key, value in payload.items()}


def get_fx_rate(source_currency, target_currency):
    source = (source_currency or "").strip().upper()
    target = (target_currency or "").strip().upper()
    if len(source) != 3 or len(target) != 3:
        raise ValidationError("Use valid three-letter currency codes.")
    if source == target:
        return Decimal("1"), "identity"

    provider = getattr(settings, "FX_PROVIDER", "disabled").strip().lower()
    if provider == "static":
        if not settings.DEBUG and not getattr(settings, "FX_ALLOW_STATIC_IN_PRODUCTION", False):
            raise ValidationError("Static FX rates are disabled in production.")
        rates = _configured_rates()
        direct = rates.get(f"{source}_{target}")
        if direct and direct > 0:
            return direct, "static"
        inverse = rates.get(f"{target}_{source}")
        if inverse and inverse > 0:
            return Decimal("1") / inverse, "static"
        raise ValidationError(f"No configured FX rate is available for {source}/{target}.")

    raise ValidationError("Cross-currency checkout is not enabled for this market yet.")


def create_fx_quote(*, profile, service_amount, service_currency, payment_currency, payout_currency=None, booking=None):
    service_currency = service_currency.upper()
    payment_currency = payment_currency.upper()
    payout_currency = (payout_currency or service_currency).upper()
    service_amount = money(service_amount)
    if service_amount <= 0:
        raise ValidationError("Amount must be greater than zero.")

    payment_rate, payment_provider = get_fx_rate(service_currency, payment_currency)
    payout_rate, payout_provider = get_fx_rate(service_currency, payout_currency)
    provider = payment_provider if payment_provider != "identity" else payout_provider
    ttl_minutes = max(1, min(int(getattr(settings, "FX_QUOTE_TTL_MINUTES", 10)), 60))
    fee_rate = Decimal(str(getattr(settings, "FX_FEE_RATE", "0")))
    payment_amount = money(service_amount * payment_rate)
    payout_amount = money(service_amount * payout_rate)
    fx_fee = money(payment_amount * fee_rate)

    return FxQuote.objects.create(
        requested_by=profile,
        booking=booking,
        service_amount=service_amount,
        service_currency=service_currency,
        payment_amount=payment_amount,
        payment_currency=payment_currency,
        payout_amount=payout_amount,
        payout_currency=payout_currency,
        fx_rate=payment_rate,
        fx_fee=fx_fee,
        provider=provider or "identity",
        provider_quote_id="",
        expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
    )


def market_payment_capability(country):
    market = market_for_country(country)
    if not market:
        return {"known_market": False, "payments_enabled": False, "payouts_enabled": False, "currency": ""}
    return {
        "known_market": True,
        "payments_enabled": market.payments_enabled,
        "payouts_enabled": market.payouts_enabled,
        "currency": market.currency,
        "optimised": market.optimised,
    }
