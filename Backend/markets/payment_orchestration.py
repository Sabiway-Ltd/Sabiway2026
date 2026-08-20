from rest_framework.exceptions import ValidationError

from .catalog import market_for_country


def _service_country(booking):
    if booking.listing_id and booking.listing:
        return booking.listing.country
    if booking.job_id and booking.job:
        return booking.job.country
    return ""


def initialize_market_checkout(*, booking, actor, idempotency_key=None, return_url=None):
    """Provider-neutral entry point for SabiPay checkout.

    The legacy Paystack implementation remains the active Nigeria/NGN adapter.
    Other markets fail closed until a payment+payout provider is explicitly enabled.

    Backward compatibility: legacy NGN bookings created before service-country
    normalisation may have no listing/job country attached. Those bookings still
    use the existing Nigeria Paystack adapter so retries and existing transaction
    tests remain valid while location data is migrated forward.
    """
    service_country = _service_country(booking)
    currency = (booking.currency or "").upper()
    market = market_for_country(service_country)

    if currency == "NGN" and (not service_country or (market and market.code == "NG")):
        from sabipay.services import initialize_checkout

        return initialize_checkout(
            booking=booking,
            actor=actor,
            idempotency_key=idempotency_key,
            return_url=return_url,
        )

    if not market:
        raise ValidationError("SabiPay checkout is not enabled for this service market yet.")
    if not market.payments_enabled:
        raise ValidationError(
            f"SabiPay marketplace discovery is available in {market.name}, but {market.currency} checkout is not activated yet."
        )
    if not market.payouts_enabled:
        raise ValidationError(
            f"SabiPay cannot fund this booking until Professional payouts are enabled for {market.name}."
        )

    raise ValidationError("No payment adapter is configured for this market yet.")
