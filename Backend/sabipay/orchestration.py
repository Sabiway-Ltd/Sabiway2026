import uuid
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from marketplace.markets import default_currency_for_country, normalise_country_code

from . import gateway
from .models import FxQuote


class PaymentCapabilityError(ValidationError):
    pass


@dataclass(frozen=True)
class PaymentMarket:
    country_code: str
    currency: str
    provider: str
    payments_enabled: bool
    payouts_enabled: bool
    fx_enabled: bool = False


DEFAULT_MARKETS = {
    # Existing production-compatible route: Nigerian NGN payments/payouts through Paystack.
    "NG": PaymentMarket("NG", "NGN", "paystack", True, True, False),
    # Marketplace-ready but intentionally payment-disabled until UK rails are configured.
    "GB": PaymentMarket("GB", "GBP", "unconfigured", False, False, False),
}


def _override(code, default):
    configured = getattr(settings, "SABIPAY_MARKETS", {}) or {}
    row = configured.get(code, {}) if isinstance(configured, dict) else {}
    if not row:
        return default
    return PaymentMarket(
        code,
        str(row.get("currency") or default.currency).upper(),
        str(row.get("provider") or default.provider),
        bool(row.get("payments_enabled", default.payments_enabled)),
        bool(row.get("payouts_enabled", default.payouts_enabled)),
        bool(row.get("fx_enabled", default.fx_enabled)),
    )


def market_config(country_code):
    code = normalise_country_code(country_code)
    default = DEFAULT_MARKETS.get(code)
    if default:
        return _override(code, default)
    currency = default_currency_for_country(code)
    return PaymentMarket(code, currency, "unconfigured", False, False, False) if code and currency else None


def require_payment_market(country_code, currency):
    market = market_config(country_code)
    currency = (currency or "").upper()
    if not market or not market.payments_enabled:
        raise PaymentCapabilityError({"payment_market": "SabiPay payments are not enabled for this market yet. Marketplace discovery and booking can still be used."})
    if market.currency != currency:
        raise PaymentCapabilityError({"payer_currency": f"The configured payment currency for {market.country_code} is {market.currency}."})
    return market


def require_payout_market(country_code, currency):
    market = market_config(country_code)
    currency = (currency or "").upper()
    if not market or not market.payouts_enabled:
        raise PaymentCapabilityError({"payout_market": "SabiPay payouts are not enabled for this professional's market yet."})
    if market.currency != currency:
        raise PaymentCapabilityError({"payout_currency": f"The configured payout currency for {market.country_code} is {market.currency}."})
    return market


def get_fx_quote(*, source_currency, target_currency, source_amount, transaction=None):
    """Return a persisted, auditable FX quote.

    Same-currency quotes are safe identity quotes. Cross-currency conversion is deliberately
    unavailable until a regulated FX provider adapter is configured; SabiWay never invents a rate.
    """
    source = (source_currency or "").upper()
    target = (target_currency or "").upper()
    amount = Decimal(str(source_amount))
    now = timezone.now()
    if source == target:
        return FxQuote.objects.create(
            transaction=transaction,
            provider="identity",
            reference=f"SWFX-{uuid.uuid4().hex}",
            source_currency=source,
            target_currency=target,
            source_amount=amount,
            target_amount=amount,
            rate=Decimal("1"),
            fee_amount=Decimal("0"),
            quoted_at=now,
            expires_at=now + timedelta(minutes=10),
        )
    raise PaymentCapabilityError({"fx": f"Live {source}→{target} conversion is not enabled until an authorised FX provider is configured. No estimated rate will be used for checkout."})


def initialize_payment(*, market, email, amount_subunit, reference, callback_url, metadata):
    if market.provider == "paystack":
        return gateway.initialize_payment(email=email, amount_subunit=amount_subunit, currency=market.currency, reference=reference, callback_url=callback_url, metadata=metadata)
    raise PaymentCapabilityError({"payment_provider": f"No payment provider is configured for {market.country_code}."})


def verify_payment(*, market, reference):
    if market.provider == "paystack":
        return gateway.verify_payment(reference)
    raise PaymentCapabilityError({"payment_provider": f"No payment provider is configured for {market.country_code}."})


def refund_payment(*, market, transaction_reference, amount_subunit, reason):
    if market.provider == "paystack":
        return gateway.initiate_refund(transaction_reference=transaction_reference, amount_subunit=amount_subunit, currency=market.currency, reason=reason)
    raise PaymentCapabilityError({"payment_provider": f"Refunds are not configured for {market.country_code}."})


def create_payout(*, market, amount_subunit, recipient_code, reference, reason):
    if market.provider == "paystack":
        return gateway.initiate_transfer(amount_subunit=amount_subunit, recipient_code=recipient_code, reference=reference, reason=reason)
    raise PaymentCapabilityError({"payout_provider": f"Payouts are not configured for {market.country_code}."})


def verify_payout(*, market, reference):
    if market.provider == "paystack":
        return gateway.verify_transfer(reference)
    raise PaymentCapabilityError({"payout_provider": f"Payout verification is not configured for {market.country_code}."})
