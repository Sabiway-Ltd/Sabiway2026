import hashlib
import uuid
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db import IntegrityError, transaction as db_transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from marketplace.markets import default_currency_for_country, normalise_country_code
from marketplace.models import BookingRequest
from verification.services import is_professional_verified

from . import gateway, orchestration
from .models import (
    Dispute,
    DisputeEvidence,
    FxQuote,
    GatewayWebhookEvent,
    PaymentAttempt,
    PayoutDestination,
    PayoutRecord,
    Transaction,
    TransactionAudit,
)

MONEY = Decimal("0.01")
ACTIVE_DISPUTE_STATUSES = [Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]
DISPUTABLE_STATES = [Transaction.State.FUNDED, Transaction.State.IN_PROGRESS, Transaction.State.DELIVERED]


def money(value):
    return Decimal(value).quantize(MONEY, rounding=ROUND_HALF_UP)


def commission_rate():
    return Decimal(str(getattr(settings, "SABIPAY_COMMISSION_RATE", "0.10")))


def split_amount(amount):
    total = money(amount)
    fee = money(total * commission_rate())
    return fee, money(total - fee)


def amount_to_subunit(amount):
    return int((money(amount) * 100).to_integral_value(rounding=ROUND_HALF_UP))


def audit(tx, event, *, actor=None, source="system", old="", new="", reason="", metadata=None, event_key=None):
    try:
        return TransactionAudit.objects.create(transaction=tx, actor=actor, source=source, event=event, from_state=old, to_state=new, reason=reason, metadata=metadata or {}, event_key=event_key)
    except IntegrityError:
        return TransactionAudit.objects.filter(event_key=event_key).first() if event_key else None


def _receipt_number():
    return f"SW-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:12].upper()}"


def _payment_reference():
    return f"SWPAY-{uuid.uuid4().hex}"


def _payout_reference():
    return f"SWPAYOUT-{uuid.uuid4().hex}"


def _safe_return_url(return_url):
    default = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')}/sabipay"
    value = (return_url or "").strip()
    if not value:
        return default
    frontend = getattr(settings, "FRONTEND_URL", "").rstrip("/")
    if frontend and (value == frontend or value.startswith(f"{frontend}/")):
        return value
    if value.startswith("sabiway://sabipay"):
        return value
    raise ValidationError({"return_url": "Unsupported SabiPay return URL."})


def _is_operator(user):
    return bool(user and user.is_staff and (user.is_superuser or user.has_perm("sabipay.manage_sabipay")))


def _participant_profile(tx, user):
    if tx.client.user_id == user.id:
        return tx.client
    if tx.professional.user_id == user.id:
        return tx.professional
    raise PermissionDenied("You are not a participant in this SabiPay transaction.")


def _profile_market(profile, *, fallback_country_code=""):
    return normalise_country_code(getattr(profile, "country_code", "") or getattr(profile, "country", "") or fallback_country_code)


def _booking_service_market(booking):
    source = booking.listing or booking.job
    if source:
        return normalise_country_code(getattr(source, "country_code", "") or getattr(source, "country", ""))
    return ""


def create_or_get_transaction(booking, actor):
    if booking.client.user_id != actor.id:
        raise PermissionDenied("Only the booking client can fund this booking.")
    if booking.status != BookingRequest.Status.ACCEPTED:
        raise ValidationError("The professional must accept the booking before payment.")
    if booking.agreed_price is None or booking.agreed_price <= 0:
        raise ValidationError("A positive agreed booking price is required.")
    if not booking.professional or not is_professional_verified(booking.professional):
        raise ValidationError("The professional must be verified before this booking can be funded.")

    service_currency = (booking.currency or "").upper()
    service_market = _booking_service_market(booking)
    client_market = _profile_market(booking.client, fallback_country_code=service_market)
    professional_market = _profile_market(booking.professional, fallback_country_code=service_market)
    payer_currency = default_currency_for_country(client_market) or service_currency
    payout_currency = default_currency_for_country(professional_market) or service_currency
    fee, provider_amount = split_amount(booking.agreed_price)

    tx, created = Transaction.objects.get_or_create(
        booking=booking,
        defaults={
            "client": booking.client,
            "professional": booking.professional,
            "amount": money(booking.agreed_price),
            "currency": service_currency,
            "service_amount": money(booking.agreed_price),
            "service_currency": service_currency,
            "payer_currency": payer_currency,
            "payout_currency": payout_currency,
            "payment_market": client_market,
            "payout_market": professional_market,
            "commission_rate": commission_rate(),
            "commission_amount": fee,
            "provider_amount": provider_amount,
            "payout_amount": provider_amount if payout_currency == service_currency else None,
            "receipt_number": _receipt_number(),
        },
    )
    if not created:
        expected = money(booking.agreed_price)
        if tx.amount != expected or tx.currency != service_currency:
            raise ValidationError("The booking price or service currency changed after SabiPay was created. Contact support before paying.")
    else:
        audit(tx, "transaction_created", actor=actor, source="client", new=tx.state, metadata={"booking_id": str(booking.id), "service_currency": service_currency, "payer_currency": payer_currency, "payout_currency": payout_currency, "payment_market": client_market, "payout_market": professional_market})
    return tx


def _prepare_fx_and_markets(tx):
    payment_market = orchestration.require_payment_market(tx.payment_market, tx.payer_currency)
    orchestration.require_payout_market(tx.payout_market, tx.payout_currency)
    if tx.payout_currency != tx.service_currency:
        raise orchestration.PaymentCapabilityError({"payout_currency": "Cross-currency provider settlement is not enabled yet. Professionals must currently settle in the service currency."})

    active_quote = tx.fx_quotes.filter(status=FxQuote.Status.ACTIVE, expires_at__gt=timezone.now(), source_currency=tx.service_currency, target_currency=tx.payer_currency).first()
    quote = active_quote or orchestration.get_fx_quote(source_currency=tx.service_currency, target_currency=tx.payer_currency, source_amount=tx.service_amount or tx.amount, transaction=tx)
    tx.payer_amount = money(quote.target_amount)
    tx.fx_rate = quote.rate
    tx.fx_provider = quote.provider
    tx.fx_quote_reference = quote.reference
    tx.fx_quoted_at = quote.quoted_at
    tx.fx_expires_at = quote.expires_at
    tx.fx_fee = money(quote.fee_amount)
    tx.payout_amount = tx.provider_amount
    tx.gateway = payment_market.provider
    tx.save(update_fields=["payer_amount", "fx_rate", "fx_provider", "fx_quote_reference", "fx_quoted_at", "fx_expires_at", "fx_fee", "payout_amount", "gateway", "updated_at"])
    return payment_market, quote


def initialize_checkout(*, booking, actor, idempotency_key=None, return_url=None):
    idempotency_key = (idempotency_key or "").strip() or None
    with db_transaction.atomic():
        tx = create_or_get_transaction(booking, actor)
        if tx.state != Transaction.State.PENDING_PAYMENT:
            raise ValidationError("This booking is no longer awaiting payment.")
        payment_market, quote = _prepare_fx_and_markets(tx)
        if idempotency_key:
            existing = PaymentAttempt.objects.select_related("transaction").filter(idempotency_key=idempotency_key).first()
            if existing:
                if existing.transaction_id != tx.id:
                    raise ValidationError("This idempotency key belongs to another payment request.")
                return tx, existing
        reference = _payment_reference()
        callback_url = _safe_return_url(return_url)
        attempt = PaymentAttempt.objects.create(transaction=tx, reference=reference, idempotency_key=idempotency_key)
        tx.payment_status = Transaction.PaymentStatus.PENDING
        tx.last_payment_error = ""
        tx.last_payment_checked_at = timezone.now()
        tx.save(update_fields=["payment_status", "last_payment_error", "last_payment_checked_at", "updated_at"])
    try:
        data = orchestration.initialize_payment(
            market=payment_market,
            email=booking.client.user.email,
            amount_subunit=amount_to_subunit(tx.payer_amount),
            reference=reference,
            callback_url=callback_url,
            metadata={"sabipay_transaction_id": str(tx.id), "booking_id": str(booking.id), "service_amount": str(tx.service_amount), "service_currency": tx.service_currency, "payer_currency": tx.payer_currency, "fx_quote_reference": quote.reference},
        )
    except (gateway.PaystackError, orchestration.PaymentCapabilityError) as exc:
        attempt.status = PaymentAttempt.Status.FAILED
        attempt.failure_reason = str(exc)
        attempt.completed_at = timezone.now()
        attempt.save(update_fields=["status", "failure_reason", "completed_at"])
        tx.payment_status = Transaction.PaymentStatus.FAILED
        tx.last_payment_error = str(exc)
        tx.last_payment_checked_at = timezone.now()
        tx.save(update_fields=["payment_status", "last_payment_error", "last_payment_checked_at", "updated_at"])
        audit(tx, "checkout_initialization_failed", actor=actor, source="gateway", reason=str(exc), metadata={"reference": reference})
        raise ValidationError(str(exc)) from exc
    attempt.authorization_url = data.get("authorization_url", "")
    attempt.access_code = data.get("access_code", "")
    attempt.save(update_fields=["authorization_url", "access_code"])
    quote.status = FxQuote.Status.USED
    quote.save(update_fields=["status"])
    audit(tx, "checkout_initialized", actor=actor, source="client", metadata={"reference": reference, "payer_amount": str(tx.payer_amount), "payer_currency": tx.payer_currency, "fx_quote_reference": quote.reference})
    return tx, attempt


def _fund_attempt(attempt, verified_data, *, source="gateway", event_key=None):
    tx_id = attempt.transaction_id
    with db_transaction.atomic():
        tx = Transaction.objects.select_for_update().get(pk=tx_id)
        attempt = PaymentAttempt.objects.select_for_update().get(pk=attempt.pk)
        amount = int(verified_data.get("amount") or 0)
        currency = (verified_data.get("currency") or "").upper()
        expected_amount = tx.payer_amount or tx.amount
        expected_currency = tx.payer_currency or tx.currency
        if amount != amount_to_subunit(expected_amount) or currency != expected_currency:
            reason = "Gateway verification did not match the expected payer amount/currency."
            attempt.status = PaymentAttempt.Status.FAILED
            attempt.failure_reason = reason
            attempt.completed_at = timezone.now()
            attempt.save(update_fields=["status", "failure_reason", "completed_at"])
            tx.payment_status = Transaction.PaymentStatus.MISMATCH
            tx.last_payment_error = reason
            tx.last_payment_checked_at = timezone.now()
            tx.reconciliation_status = Transaction.ReconciliationStatus.MISMATCH
            tx.reconciliation_note = reason
            tx.reconciled_at = timezone.now()
            tx.save(update_fields=["payment_status", "last_payment_error", "last_payment_checked_at", "reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
            audit(tx, "funding_mismatch", source=source, reason=reason, metadata={"reference": attempt.reference}, event_key=event_key)
            raise ValidationError("Payment verification did not match this booking.")
        attempt.status = PaymentAttempt.Status.SUCCESS
        attempt.failure_reason = ""
        attempt.gateway_transaction_id = str(verified_data.get("id") or "")
        attempt.completed_at = timezone.now()
        attempt.save(update_fields=["status", "failure_reason", "gateway_transaction_id", "completed_at"])
        tx.payment_status = Transaction.PaymentStatus.SUCCEEDED
        tx.last_payment_error = ""
        tx.last_payment_checked_at = timezone.now()
        if tx.state != Transaction.State.PENDING_PAYMENT:
            if tx.funding_reference != attempt.reference:
                tx.reconciliation_status = Transaction.ReconciliationStatus.MISMATCH
                tx.reconciliation_note = "A second successful payment was detected for an already funded booking."
                tx.reconciled_at = timezone.now()
                tx.save(update_fields=["payment_status", "last_payment_error", "last_payment_checked_at", "reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
                audit(tx, "duplicate_successful_charge_detected", source=source, reason=tx.reconciliation_note, metadata={"reference": attempt.reference}, event_key=event_key)
            else:
                tx.save(update_fields=["payment_status", "last_payment_error", "last_payment_checked_at", "updated_at"])
            return tx
        old = tx.state
        tx.state = Transaction.State.FUNDED
        tx.funding_reference = attempt.reference
        tx.gateway_transaction_id = attempt.gateway_transaction_id
        tx.funded_at = timezone.now()
        tx.reconciliation_status = Transaction.ReconciliationStatus.MATCHED
        tx.reconciliation_note = "Funding payer amount, payer currency and gateway status verified."
        tx.reconciled_at = timezone.now()
        tx.save()
        audit(tx, "escrow_funded", source=source, old=old, new=tx.state, metadata={"reference": attempt.reference, "service_amount": str(tx.service_amount), "service_currency": tx.service_currency, "payer_amount": str(tx.payer_amount), "payer_currency": tx.payer_currency, "payout_amount": str(tx.payout_amount or ""), "payout_currency": tx.payout_currency, "fx_rate": str(tx.fx_rate or "")}, event_key=event_key)
        return tx


def apply_payment_verification(attempt, data, *, source="client", event_key=None):
    status_value = str(data.get("status") or "").lower()
    if status_value == "success":
        return _fund_attempt(attempt, data, source=source, event_key=event_key)
    with db_transaction.atomic():
        tx = Transaction.objects.select_for_update().get(pk=attempt.transaction_id)
        attempt = PaymentAttempt.objects.select_for_update().get(pk=attempt.pk)
        now = timezone.now()
        if status_value in {"failed", "reversed"}:
            attempt.status = PaymentAttempt.Status.FAILED
            tx.payment_status = Transaction.PaymentStatus.FAILED
            reason = str(data.get("gateway_response") or data.get("message") or "Payment failed at the gateway.")
        elif status_value in {"abandoned", "cancelled"}:
            attempt.status = PaymentAttempt.Status.ABANDONED
            tx.payment_status = Transaction.PaymentStatus.ABANDONED
            reason = "Checkout was not completed. You can safely try again."
        else:
            tx.payment_status = Transaction.PaymentStatus.PENDING
            reason = "Payment is still pending confirmation from the provider."
        if attempt.status != PaymentAttempt.Status.INITIALIZED:
            attempt.failure_reason = reason
            attempt.completed_at = now
            attempt.save(update_fields=["status", "failure_reason", "completed_at"])
        tx.last_payment_error = reason if tx.payment_status in {Transaction.PaymentStatus.FAILED, Transaction.PaymentStatus.ABANDONED} else ""
        tx.last_payment_checked_at = now
        tx.reconciliation_status = Transaction.ReconciliationStatus.PENDING
        tx.reconciliation_note = reason
        tx.reconciled_at = now
        tx.save(update_fields=["payment_status", "last_payment_error", "last_payment_checked_at", "reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
        audit(tx, "payment_status_checked", source=source, reason=reason, metadata={"reference": attempt.reference, "gateway_status": status_value or "unknown"}, event_key=event_key)
        return tx


def _tx_payment_market(tx):
    return orchestration.require_payment_market(tx.payment_market, tx.payer_currency or tx.currency)


def verify_attempt(attempt, *, source="client"):
    try:
        data = orchestration.verify_payment(market=_tx_payment_market(attempt.transaction), reference=attempt.reference)
    except (gateway.PaystackError, orchestration.PaymentCapabilityError) as exc:
        tx = attempt.transaction
        tx.payment_status = Transaction.PaymentStatus.PENDING
        tx.last_payment_checked_at = timezone.now()
        tx.reconciliation_status = Transaction.ReconciliationStatus.PENDING
        tx.reconciliation_note = f"Gateway status could not be confirmed yet: {exc}"
        tx.reconciled_at = timezone.now()
        tx.save(update_fields=["payment_status", "last_payment_checked_at", "reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
        audit(tx, "payment_verification_deferred", source=source, reason=str(exc), metadata={"reference": attempt.reference})
        raise ValidationError("Payment confirmation is temporarily unavailable. Your payment has not been marked failed; retry status shortly.") from exc
    return apply_payment_verification(attempt, data, source=source)


def start_service(tx, actor):
    if tx.professional.user_id != actor.id:
        raise PermissionDenied("Only the professional can start the funded service.")
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().get(pk=tx.pk)
        if locked.state != Transaction.State.FUNDED:
            raise ValidationError("Service can only start after SabiPay confirms escrow funding.")
        old = locked.state
        locked.state = Transaction.State.IN_PROGRESS
        locked.service_started_at = timezone.now()
        locked.save(update_fields=["state", "service_started_at", "updated_at"])
        booking = locked.booking
        if booking.status == BookingRequest.Status.ACCEPTED:
            booking.status = BookingRequest.Status.IN_PROGRESS
            booking.save(update_fields=["status", "updated_at"])
        audit(locked, "service_started", actor=actor, source="professional", old=old, new=locked.state)
        return locked


def mark_delivered(tx, actor):
    if tx.professional.user_id != actor.id:
        raise PermissionDenied("Only the professional can mark service delivery complete.")
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().get(pk=tx.pk)
        if locked.state != Transaction.State.IN_PROGRESS:
            raise ValidationError("Only an in-progress funded service can be marked delivered.")
        now = timezone.now()
        old = locked.state
        locked.state = Transaction.State.DELIVERED
        locked.delivered_at = now
        locked.release_eligible_at = now + timedelta(days=int(getattr(settings, "SABIPAY_FREEZE_DAYS", 7)))
        locked.save(update_fields=["state", "delivered_at", "release_eligible_at", "updated_at"])
        booking = locked.booking
        if booking.status == BookingRequest.Status.IN_PROGRESS:
            booking.status = BookingRequest.Status.COMPLETED
            booking.save(update_fields=["status", "updated_at"])
        audit(locked, "service_delivered_freeze_started", actor=actor, source="professional", old=old, new=locked.state, metadata={"release_eligible_at": locked.release_eligible_at.isoformat()})
        return locked


def create_payout_destination(*, professional, actor, account_number, bank_code, bank_name="", country_code="", currency=""):
    if professional.user_id != actor.id:
        raise PermissionDenied("You can only configure your own payout destination.")
    if not is_professional_verified(professional):
        raise ValidationError("Provider verification approval is required before payout setup.")
    market_code = normalise_country_code(country_code or professional.country_code or professional.country)
    payout_currency = (currency or default_currency_for_country(market_code)).upper()
    market = orchestration.require_payout_market(market_code, payout_currency)
    if market.provider != "paystack" or market_code != "NG":
        raise ValidationError("Bank payout setup is not configured for this market yet.")
    digits = "".join(ch for ch in str(account_number) if ch.isdigit())
    if len(digits) != 10:
        raise ValidationError({"account_number": "Enter a valid 10-digit Nigerian account number."})
    try:
        resolved = gateway.resolve_account(digits, bank_code)
        account_name = resolved.get("account_name") or professional.full_name
        recipient = gateway.create_transfer_recipient(name=account_name, account_number=digits, bank_code=bank_code, currency=payout_currency, metadata={"sabiway_professional_id": professional.pk})
    except gateway.PaystackError as exc:
        raise ValidationError(str(exc)) from exc
    recipient_code = recipient.get("recipient_code")
    if not recipient_code:
        raise ValidationError("The payout provider did not return a recipient code.")
    destination, _ = PayoutDestination.objects.update_or_create(professional=professional, defaults={"gateway": market.provider, "country_code": market_code, "currency": payout_currency, "recipient_code": recipient_code, "account_name": account_name, "bank_code": bank_code, "bank_name": bank_name, "account_last4": digits[-4:], "is_active": True, "verified_at": timezone.now()})
    return destination


def release_transaction(tx, *, actor=None, source="scheduler", client_confirmed=False, force=False):
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().select_related("professional__user").get(pk=tx.pk)
        if locked.state == Transaction.State.RELEASED:
            return locked, getattr(locked, "payout", None)
        if locked.state != Transaction.State.DELIVERED:
            raise ValidationError("Only delivered escrow can be released.")
        if Dispute.objects.filter(transaction=locked, status__in=ACTIVE_DISPUTE_STATUSES).exists():
            raise ValidationError("This escrow is frozen by an active dispute.")
        now = timezone.now()
        if client_confirmed:
            if not actor or locked.client.user_id != actor.id:
                raise PermissionDenied("Only the client can confirm satisfaction.")
            locked.client_confirmed_at = now
        elif not force and (not locked.release_eligible_at or now < locked.release_eligible_at):
            raise ValidationError("The SabiPay freeze period has not ended.")
        try:
            destination = locked.professional.sabipay_payout_destination
        except PayoutDestination.DoesNotExist as exc:
            audit(locked, "release_blocked_no_payout_destination", actor=actor, source=source)
            raise ValidationError("The professional must configure a verified payout destination before release.") from exc
        if not destination.is_active:
            raise ValidationError("The professional payout destination is inactive.")
        payout_market = orchestration.require_payout_market(destination.country_code or locked.payout_market, destination.currency or locked.payout_currency)
        payout_amount = locked.payout_amount or locked.provider_amount
        payout_currency = locked.payout_currency or locked.currency
        if destination.currency != payout_currency:
            raise ValidationError("The payout destination currency does not match the transaction payout currency.")
        payout, created = PayoutRecord.objects.get_or_create(transaction=locked, defaults={"destination": destination, "amount": payout_amount, "currency": payout_currency, "reference": _payout_reference()})
        if not created and payout.status not in {PayoutRecord.Status.FAILED, PayoutRecord.Status.MANUAL_REVIEW}:
            return locked, payout
        if not created:
            payout.destination = destination
            payout.reference = _payout_reference()
            payout.status = PayoutRecord.Status.PENDING
            payout.failure_reason = ""
            payout.save()
        reference = payout.reference
        try:
            data = orchestration.create_payout(market=payout_market, amount_subunit=amount_to_subunit(payout_amount), recipient_code=destination.recipient_code, reference=reference, reason=f"SabiWay payout {locked.receipt_number}")
        except (gateway.PaystackError, orchestration.PaymentCapabilityError) as exc:
            payout.status = PayoutRecord.Status.FAILED
            payout.failure_reason = str(exc)
            payout.save(update_fields=["status", "failure_reason", "updated_at"])
            audit(locked, "payout_initiation_failed", actor=actor, source=source, reason=str(exc), metadata={"payout_reference": reference})
            raise ValidationError(str(exc)) from exc
        old = locked.state
        payout.status = PayoutRecord.Status.PROCESSING
        payout.transfer_code = data.get("transfer_code", "")
        payout.initiated_at = now
        payout.save(update_fields=["status", "transfer_code", "initiated_at", "updated_at"])
        locked.state = Transaction.State.RELEASED
        locked.released_at = now
        fields = ["state", "released_at", "updated_at"]
        if client_confirmed:
            fields.append("client_confirmed_at")
        locked.save(update_fields=fields)
        audit(locked, "escrow_released_to_payout", actor=actor, source=source, old=old, new=locked.state, metadata={"payout_reference": reference, "commission": str(locked.commission_amount), "payout_amount": str(payout_amount), "payout_currency": payout_currency})
        return locked, payout


def cancel_unfunded_transaction(booking, actor):
    tx = Transaction.objects.filter(booking=booking).first()
    if not tx:
        return None
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().get(pk=tx.pk)
        if locked.state == Transaction.State.PENDING_PAYMENT:
            old = locked.state
            locked.state = Transaction.State.CANCELLED
            locked.payment_status = Transaction.PaymentStatus.ABANDONED
            locked.cancelled_at = timezone.now()
            locked.save(update_fields=["state", "payment_status", "cancelled_at", "updated_at"])
            PaymentAttempt.objects.filter(transaction=locked, status=PaymentAttempt.Status.INITIALIZED).update(status=PaymentAttempt.Status.ABANDONED, completed_at=timezone.now())
            audit(locked, "unfunded_booking_cancelled", actor=actor, source="booking", old=old, new=locked.state)
            return locked
        if locked.state in {Transaction.State.FUNDED, Transaction.State.IN_PROGRESS, Transaction.State.DELIVERED, Transaction.State.RELEASED, Transaction.State.DISPUTED}:
            raise ValidationError("This booking has SabiPay funds. Use the controlled refund/dispute process instead of direct cancellation.")
        return locked


def request_refund(tx, *, actor, reason):
    if not _is_operator(actor):
        raise PermissionDenied("Only an authorised SabiPay operator can initiate refunds.")
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().get(pk=tx.pk)
        if locked.state not in {Transaction.State.FUNDED, Transaction.State.IN_PROGRESS, Transaction.State.DELIVERED, Transaction.State.DISPUTED}:
            raise ValidationError("Only funded, unreleased SabiPay transactions can enter the controlled refund process.")
        if locked.refund_status == Transaction.RefundStatus.PENDING:
            return locked
        try:
            data = orchestration.refund_payment(market=_tx_payment_market(locked), transaction_reference=locked.funding_reference, amount_subunit=amount_to_subunit(locked.payer_amount or locked.amount), reason=reason or "Approved SabiWay refund")
        except (gateway.PaystackError, orchestration.PaymentCapabilityError) as exc:
            locked.refund_status = Transaction.RefundStatus.FAILED
            locked.refund_reason = str(exc)
            locked.save(update_fields=["refund_status", "refund_reason", "updated_at"])
            audit(locked, "refund_initiation_failed", actor=actor, source="admin", reason=str(exc))
            raise ValidationError(str(exc)) from exc
        locked.refund_status = Transaction.RefundStatus.PENDING
        locked.refund_gateway_id = str(data.get("id") or "")
        locked.refund_reason = reason
        locked.save(update_fields=["refund_status", "refund_gateway_id", "refund_reason", "updated_at"])
        audit(locked, "refund_initiated", actor=actor, source="admin", reason=reason, metadata={"gateway_refund_id": locked.refund_gateway_id, "refund_currency": locked.payer_currency or locked.currency, "original_fx_quote": locked.fx_quote_reference})
        if str(data.get("status") or "").lower() in {"processed", "success"}:
            return mark_refunded(locked, source="gateway")
        return locked


def mark_refunded(tx, *, source="gateway", event_key=None):
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().get(pk=tx.pk)
        if locked.state == Transaction.State.REFUNDED:
            return locked
        if locked.state not in {Transaction.State.FUNDED, Transaction.State.IN_PROGRESS, Transaction.State.DELIVERED, Transaction.State.DISPUTED}:
            return locked
        old = locked.state
        locked.state = Transaction.State.REFUNDED
        locked.refund_status = Transaction.RefundStatus.PROCESSED
        locked.refunded_at = timezone.now()
        locked.save(update_fields=["state", "refund_status", "refunded_at", "updated_at"])
        audit(locked, "refund_processed", source=source, old=old, new=locked.state, metadata={"original_payer_amount": str(locked.payer_amount or locked.amount), "payer_currency": locked.payer_currency or locked.currency, "fx_quote_reference": locked.fx_quote_reference}, event_key=event_key)
        return locked


def open_dispute(tx, *, actor, reason, details):
    profile = _participant_profile(tx, actor)
    details = (details or "").strip()
    if len(details) < 10:
        raise ValidationError({"details": "Explain what happened so SabiWay can review it."})
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().get(pk=tx.pk)
        if locked.state not in DISPUTABLE_STATES:
            raise ValidationError("A dispute can only be opened after funding and before funds are released or refunded.")
        if Dispute.objects.filter(transaction=locked, status__in=ACTIVE_DISPUTE_STATUSES).exists():
            raise ValidationError("This transaction already has an active dispute.")
        prior_state = locked.state
        dispute = Dispute.objects.create(transaction=locked, opened_by=actor, opened_by_profile=profile, reason=reason, details=details, transaction_state_at_open=prior_state)
        locked.state = Transaction.State.DISPUTED
        locked.save(update_fields=["state", "updated_at"])
        audit(locked, "dispute_opened", actor=actor, source="participant", old=prior_state, new=locked.state, reason=reason, metadata={"dispute_id": str(dispute.id), "service_currency": locked.service_currency, "payer_currency": locked.payer_currency, "payout_currency": locked.payout_currency})
        return dispute


def add_dispute_evidence(dispute, *, actor, note, reference_url=""):
    profile = _participant_profile(dispute.transaction, actor)
    if dispute.status not in ACTIVE_DISPUTE_STATUSES:
        raise ValidationError("Evidence can only be added while the dispute is active.")
    note = (note or "").strip()
    if len(note) < 3:
        raise ValidationError({"note": "Add a short description of this evidence."})
    evidence = DisputeEvidence.objects.create(dispute=dispute, submitted_by=profile, note=note, reference_url=(reference_url or "").strip())
    audit(dispute.transaction, "dispute_evidence_added", actor=actor, source="participant", metadata={"dispute_id": str(dispute.id), "evidence_id": str(evidence.id)})
    return evidence


def start_dispute_review(dispute, *, actor):
    if not _is_operator(actor):
        raise PermissionDenied("Only an authorised SabiPay operator can review disputes.")
    if dispute.status != Dispute.Status.OPEN:
        raise ValidationError("Only open disputes can move to review.")
    dispute.status = Dispute.Status.UNDER_REVIEW
    dispute.assigned_to = actor
    dispute.reviewed_at = timezone.now()
    dispute.save(update_fields=["status", "assigned_to", "reviewed_at"])
    audit(dispute.transaction, "dispute_review_started", actor=actor, source="admin", metadata={"dispute_id": str(dispute.id)})
    return dispute


def resolve_dispute(dispute, *, actor, outcome, resolution):
    if not _is_operator(actor):
        raise PermissionDenied("Only an authorised SabiPay operator can resolve disputes.")
    if dispute.status not in ACTIVE_DISPUTE_STATUSES:
        raise ValidationError("This dispute is no longer active.")
    resolution = (resolution or "").strip()
    if len(resolution) < 5:
        raise ValidationError({"resolution": "Record the reason for the dispute decision."})
    tx = dispute.transaction
    restore_state = dispute.transaction_state_at_open
    if restore_state not in DISPUTABLE_STATES:
        raise ValidationError("The transaction state captured when this dispute opened cannot be safely restored.")
    dispute.status = Dispute.Status.RESOLVED
    dispute.outcome = outcome
    dispute.resolution = resolution
    dispute.resolved_by = actor
    dispute.resolved_at = timezone.now()
    dispute.save(update_fields=["status", "outcome", "resolution", "resolved_by", "resolved_at"])
    locked = Transaction.objects.get(pk=tx.pk)
    old = locked.state
    if outcome in {Dispute.Outcome.RESUME, Dispute.Outcome.CLOSED_NO_ACTION}:
        locked.state = restore_state
        locked.save(update_fields=["state", "updated_at"])
        audit(locked, "dispute_resolved_resume", actor=actor, source="admin", old=old, new=locked.state, reason=resolution, metadata={"dispute_id": str(dispute.id), "outcome": outcome})
    elif outcome == Dispute.Outcome.REFUND:
        request_refund(locked, actor=actor, reason=resolution)
        audit(locked, "dispute_resolved_refund", actor=actor, source="admin", old=old, new=locked.state, reason=resolution, metadata={"dispute_id": str(dispute.id)})
    elif outcome == Dispute.Outcome.RELEASE:
        if restore_state != Transaction.State.DELIVERED:
            dispute.status = Dispute.Status.UNDER_REVIEW
            dispute.outcome = Dispute.Outcome.NONE
            dispute.resolution = ""
            dispute.resolved_by = None
            dispute.resolved_at = None
            dispute.save(update_fields=["status", "outcome", "resolution", "resolved_by", "resolved_at"])
            raise ValidationError("Provider release is only valid for a dispute opened after delivery.")
        locked.state = Transaction.State.DELIVERED
        locked.save(update_fields=["state", "updated_at"])
        release_transaction(locked, actor=actor, source="admin", force=True)
        audit(locked, "dispute_resolved_release", actor=actor, source="admin", old=old, new=Transaction.State.RELEASED, reason=resolution, metadata={"dispute_id": str(dispute.id)})
    else:
        raise ValidationError("Unsupported dispute outcome.")
    return Dispute.objects.select_related("transaction", "opened_by_profile", "assigned_to", "resolved_by").get(pk=dispute.pk)


def process_webhook(raw_body, payload):
    digest = hashlib.sha256(raw_body).hexdigest()
    event_name = str(payload.get("event") or "")
    data = payload.get("data") or {}
    reference = str(data.get("reference") or "")
    webhook, created = GatewayWebhookEvent.objects.get_or_create(digest=digest, defaults={"event_name": event_name, "reference": reference})
    if not created and webhook.processed:
        return webhook
    note = "ignored"
    try:
        if event_name == "charge.success":
            attempt = PaymentAttempt.objects.select_related("transaction").filter(reference=reference).first()
            if attempt:
                verified = orchestration.verify_payment(market=_tx_payment_market(attempt.transaction), reference=reference)
                apply_payment_verification(attempt, verified, source="gateway", event_key=f"webhook:{digest}")
                note = "funding processed"
            else:
                note = "unknown payment reference"
        elif event_name.startswith("transfer."):
            payout = PayoutRecord.objects.select_related("transaction").filter(reference=reference).first()
            if payout:
                status_map = {"transfer.success": PayoutRecord.Status.PAID, "transfer.failed": PayoutRecord.Status.FAILED, "transfer.reversed": PayoutRecord.Status.REVERSED}
                next_status = status_map.get(event_name)
                if next_status:
                    payout.status = next_status
                    payout.completed_at = timezone.now() if next_status == PayoutRecord.Status.PAID else payout.completed_at
                    payout.failure_reason = str(data.get("reason") or data.get("message") or "") if next_status != PayoutRecord.Status.PAID else ""
                    payout.save(update_fields=["status", "completed_at", "failure_reason", "updated_at"])
                    audit(payout.transaction, event_name.replace(".", "_"), source="gateway", metadata={"payout_reference": reference}, event_key=f"webhook:{digest}")
                    note = "payout status processed"
        elif event_name in {"refund.processed", "refund.success"}:
            gateway_id = str(data.get("id") or "")
            tx = Transaction.objects.filter(refund_gateway_id=gateway_id).first() if gateway_id else None
            if not tx:
                original = data.get("transaction") or {}
                original_ref = original.get("reference") if isinstance(original, dict) else ""
                tx = Transaction.objects.filter(funding_reference=original_ref).first() if original_ref else None
            if tx:
                mark_refunded(tx, source="gateway", event_key=f"webhook:{digest}")
                note = "refund processed"
    finally:
        webhook.processed = True
        webhook.processing_note = note
        webhook.processed_at = timezone.now()
        webhook.save(update_fields=["processed", "processing_note", "processed_at"])
    return webhook


def reconcile_transaction(tx):
    latest_success = tx.payment_attempts.filter(status=PaymentAttempt.Status.SUCCESS).first()
    latest_attempt = latest_success or tx.payment_attempts.first()
    now = timezone.now()
    if not latest_attempt:
        tx.payment_status = Transaction.PaymentStatus.NOT_STARTED
        tx.reconciliation_status = Transaction.ReconciliationStatus.PENDING
        tx.reconciliation_note = "No payment attempt exists yet."
        tx.last_payment_checked_at = now
        tx.reconciled_at = now
        tx.save(update_fields=["payment_status", "last_payment_checked_at", "reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
        return tx
    try:
        data = orchestration.verify_payment(market=_tx_payment_market(tx), reference=latest_attempt.reference)
    except (gateway.PaystackError, orchestration.PaymentCapabilityError) as exc:
        tx.reconciliation_status = Transaction.ReconciliationStatus.PENDING
        tx.reconciliation_note = f"Gateway confirmation pending: {exc}"
        tx.last_payment_checked_at = now
        tx.reconciled_at = now
        tx.save(update_fields=["last_payment_checked_at", "reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
        audit(tx, "reconciliation_deferred", source="reconciliation", reason=str(exc), metadata={"reference": latest_attempt.reference})
        return tx
    gateway_status = str(data.get("status") or "").lower()
    if tx.state == Transaction.State.PENDING_PAYMENT:
        return apply_payment_verification(latest_attempt, data, source="reconciliation")
    expected_amount = tx.payer_amount or tx.amount
    expected_currency = tx.payer_currency or tx.currency
    gateway_success = gateway_status == "success" and int(data.get("amount") or 0) == amount_to_subunit(expected_amount) and (data.get("currency") or "").upper() == expected_currency
    expected_funded = tx.state not in {Transaction.State.PENDING_PAYMENT, Transaction.State.CANCELLED}
    tx.payment_status = Transaction.PaymentStatus.SUCCEEDED if gateway_success else Transaction.PaymentStatus.MISMATCH
    tx.reconciliation_status = Transaction.ReconciliationStatus.MATCHED if gateway_success == expected_funded else Transaction.ReconciliationStatus.MISMATCH
    tx.reconciliation_note = "Gateway funding status reconciled." if tx.reconciliation_status == Transaction.ReconciliationStatus.MATCHED else "Gateway funding status differs from the SabiPay ledger."
    tx.last_payment_error = "" if tx.reconciliation_status == Transaction.ReconciliationStatus.MATCHED else tx.reconciliation_note
    tx.last_payment_checked_at = now
    tx.reconciled_at = now
    tx.save(update_fields=["payment_status", "last_payment_error", "last_payment_checked_at", "reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
    return tx
