import hashlib
import json
import uuid
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db import IntegrityError, transaction as db_transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from marketplace.models import BookingRequest
from verification.services import is_professional_verified

from . import gateway
from .models import (
    Dispute,
    GatewayWebhookEvent,
    PaymentAttempt,
    PayoutDestination,
    PayoutRecord,
    Transaction,
    TransactionAudit,
)

MONEY = Decimal("0.01")


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
        return TransactionAudit.objects.create(
            transaction=tx,
            actor=actor,
            source=source,
            event=event,
            from_state=old,
            to_state=new,
            reason=reason,
            metadata=metadata or {},
            event_key=event_key,
        )
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


def create_or_get_transaction(booking, actor):
    if actor.profile_id if hasattr(actor, "profile_id") else False:
        pass
    if booking.client.user_id != actor.id:
        raise PermissionDenied("Only the booking client can fund this booking.")
    if booking.status != BookingRequest.Status.ACCEPTED:
        raise ValidationError("The professional must accept the booking before payment.")
    if booking.currency.upper() != "NGN":
        raise ValidationError("Phase 7 SabiPay supports NGN Nigeria-pilot bookings only.")
    if booking.agreed_price is None or booking.agreed_price <= 0:
        raise ValidationError("A positive agreed booking price is required.")
    if not booking.professional or not is_professional_verified(booking.professional):
        raise ValidationError("The professional must be verified before this booking can be funded.")
    fee, provider_amount = split_amount(booking.agreed_price)
    tx, created = Transaction.objects.get_or_create(
        booking=booking,
        defaults={
            "client": booking.client,
            "professional": booking.professional,
            "amount": money(booking.agreed_price),
            "currency": "NGN",
            "commission_rate": commission_rate(),
            "commission_amount": fee,
            "provider_amount": provider_amount,
            "receipt_number": _receipt_number(),
        },
    )
    if not created:
        expected = money(booking.agreed_price)
        if tx.amount != expected or tx.currency != "NGN":
            raise ValidationError("The booking price changed after SabiPay was created. Contact support before paying.")
    else:
        audit(tx, "transaction_created", actor=actor, source="client", new=tx.state, metadata={"booking_id": str(booking.id)})
    return tx


def initialize_checkout(*, booking, actor, idempotency_key=None, return_url=None):
    idempotency_key = (idempotency_key or "").strip() or None
    with db_transaction.atomic():
        tx = create_or_get_transaction(booking, actor)
        if tx.state != Transaction.State.PENDING_PAYMENT:
            raise ValidationError("This booking is no longer awaiting payment.")
        if idempotency_key:
            existing = PaymentAttempt.objects.select_related("transaction").filter(idempotency_key=idempotency_key).first()
            if existing:
                if existing.transaction_id != tx.id:
                    raise ValidationError("This idempotency key belongs to another payment request.")
                return tx, existing
        reference = _payment_reference()
        callback_url = _safe_return_url(return_url)
        attempt = PaymentAttempt.objects.create(transaction=tx, reference=reference, idempotency_key=idempotency_key)
    try:
        data = gateway.initialize_payment(
            email=booking.client.user.email,
            amount_subunit=amount_to_subunit(tx.amount),
            reference=reference,
            callback_url=callback_url,
            metadata={"sabipay_transaction_id": str(tx.id), "booking_id": str(booking.id)},
        )
    except gateway.PaystackError as exc:
        attempt.status = PaymentAttempt.Status.FAILED
        attempt.failure_reason = str(exc)
        attempt.completed_at = timezone.now()
        attempt.save(update_fields=["status", "failure_reason", "completed_at"])
        audit(tx, "checkout_initialization_failed", actor=actor, source="gateway", reason=str(exc), metadata={"reference": reference})
        raise ValidationError(str(exc)) from exc
    attempt.authorization_url = data.get("authorization_url", "")
    attempt.access_code = data.get("access_code", "")
    attempt.save(update_fields=["authorization_url", "access_code"])
    audit(tx, "checkout_initialized", actor=actor, source="client", metadata={"reference": reference})
    return tx, attempt


def _fund_attempt(attempt, verified_data, *, source="gateway", event_key=None):
    tx_id = attempt.transaction_id
    with db_transaction.atomic():
        tx = Transaction.objects.select_for_update().get(pk=tx_id)
        attempt = PaymentAttempt.objects.select_for_update().get(pk=attempt.pk)
        status = verified_data.get("status")
        amount = int(verified_data.get("amount") or 0)
        currency = (verified_data.get("currency") or "").upper()
        if status != "success" or amount != amount_to_subunit(tx.amount) or currency != tx.currency:
            attempt.status = PaymentAttempt.Status.FAILED
            attempt.failure_reason = "Gateway verification did not match the expected successful amount/currency."
            attempt.completed_at = timezone.now()
            attempt.save(update_fields=["status", "failure_reason", "completed_at"])
            tx.reconciliation_status = Transaction.ReconciliationStatus.MISMATCH
            tx.reconciliation_note = attempt.failure_reason
            tx.reconciled_at = timezone.now()
            tx.save(update_fields=["reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
            audit(tx, "funding_mismatch", source=source, reason=attempt.failure_reason, metadata={"reference": attempt.reference}, event_key=event_key)
            raise ValidationError("Payment verification did not match this booking.")
        attempt.status = PaymentAttempt.Status.SUCCESS
        attempt.gateway_transaction_id = str(verified_data.get("id") or "")
        attempt.completed_at = timezone.now()
        attempt.save(update_fields=["status", "gateway_transaction_id", "completed_at"])
        if tx.state != Transaction.State.PENDING_PAYMENT:
            if tx.funding_reference != attempt.reference:
                tx.reconciliation_status = Transaction.ReconciliationStatus.MISMATCH
                tx.reconciliation_note = "A second successful payment was detected for an already funded booking."
                tx.reconciled_at = timezone.now()
                tx.save(update_fields=["reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
                audit(tx, "duplicate_successful_charge_detected", source=source, reason=tx.reconciliation_note, metadata={"reference": attempt.reference}, event_key=event_key)
            return tx
        old = tx.state
        tx.state = Transaction.State.FUNDED
        tx.funding_reference = attempt.reference
        tx.gateway_transaction_id = attempt.gateway_transaction_id
        tx.funded_at = timezone.now()
        tx.reconciliation_status = Transaction.ReconciliationStatus.MATCHED
        tx.reconciliation_note = "Funding amount, currency and gateway status verified."
        tx.reconciled_at = timezone.now()
        tx.save()
        audit(tx, "escrow_funded", source=source, old=old, new=tx.state, metadata={"reference": attempt.reference}, event_key=event_key)
        return tx


def verify_attempt(attempt, *, source="client"):
    try:
        data = gateway.verify_payment(attempt.reference)
    except gateway.PaystackError as exc:
        raise ValidationError(str(exc)) from exc
    return _fund_attempt(attempt, data, source=source)


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
        locked.release_eligible_at = now + timedelta(days=7)
        locked.save(update_fields=["state", "delivered_at", "release_eligible_at", "updated_at"])
        booking = locked.booking
        if booking.status == BookingRequest.Status.IN_PROGRESS:
            booking.status = BookingRequest.Status.COMPLETED
            booking.save(update_fields=["status", "updated_at"])
        audit(locked, "service_delivered_freeze_started", actor=actor, source="professional", old=old, new=locked.state, metadata={"release_eligible_at": locked.release_eligible_at.isoformat()})
        return locked


def create_payout_destination(*, professional, actor, account_number, bank_code, bank_name=""):
    if professional.user_id != actor.id:
        raise PermissionDenied("You can only configure your own payout destination.")
    if not is_professional_verified(professional):
        raise ValidationError("Provider verification approval is required before payout setup.")
    digits = "".join(ch for ch in str(account_number) if ch.isdigit())
    if len(digits) != 10:
        raise ValidationError({"account_number": "Enter a valid 10-digit Nigerian account number."})
    try:
        resolved = gateway.resolve_account(digits, bank_code)
        account_name = resolved.get("account_name") or professional.full_name
        recipient = gateway.create_transfer_recipient(
            name=account_name,
            account_number=digits,
            bank_code=bank_code,
            metadata={"sabiway_professional_id": professional.pk},
        )
    except gateway.PaystackError as exc:
        raise ValidationError(str(exc)) from exc
    recipient_code = recipient.get("recipient_code")
    if not recipient_code:
        raise ValidationError("Paystack did not return a payout recipient code.")
    destination, _ = PayoutDestination.objects.update_or_create(
        professional=professional,
        defaults={
            "gateway": "paystack",
            "recipient_code": recipient_code,
            "account_name": account_name,
            "bank_code": bank_code,
            "bank_name": bank_name,
            "account_last4": digits[-4:],
            "is_active": True,
            "verified_at": timezone.now(),
        },
    )
    return destination


def release_transaction(tx, *, actor=None, source="scheduler", client_confirmed=False, force=False):
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().select_related("professional__user").get(pk=tx.pk)
        if locked.state == Transaction.State.RELEASED:
            return locked, getattr(locked, "payout", None)
        if locked.state != Transaction.State.DELIVERED:
            raise ValidationError("Only delivered escrow can be released.")
        if Dispute.objects.filter(transaction=locked, status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]).exists():
            raise ValidationError("This escrow is frozen by an active dispute.")
        now = timezone.now()
        if client_confirmed:
            if not actor or locked.client.user_id != actor.id:
                raise PermissionDenied("Only the client can confirm satisfaction.")
            locked.client_confirmed_at = now
        elif not force and (not locked.release_eligible_at or now < locked.release_eligible_at):
            raise ValidationError("The 7-day SabiPay freeze period has not ended.")
        try:
            destination = locked.professional.sabipay_payout_destination
        except PayoutDestination.DoesNotExist as exc:
            audit(locked, "release_blocked_no_payout_destination", actor=actor, source=source)
            raise ValidationError("The professional must configure a verified payout destination before release.") from exc
        if not destination.is_active:
            raise ValidationError("The professional payout destination is inactive.")
        payout, created = PayoutRecord.objects.get_or_create(
            transaction=locked,
            defaults={
                "destination": destination,
                "amount": locked.provider_amount,
                "currency": locked.currency,
                "reference": _payout_reference(),
            },
        )
        if not created and payout.status not in {PayoutRecord.Status.FAILED, PayoutRecord.Status.MANUAL_REVIEW}:
            return locked, payout
        if not created:
            payout.destination = destination
            payout.reference = _payout_reference()
            payout.status = PayoutRecord.Status.PENDING
            payout.failure_reason = ""
            payout.save()
        reference = payout.reference
        amount_subunit = amount_to_subunit(locked.provider_amount)
        try:
            data = gateway.initiate_transfer(
                amount_subunit=amount_subunit,
                recipient_code=destination.recipient_code,
                reference=reference,
                reason=f"SabiWay payout {locked.receipt_number}",
            )
        except gateway.PaystackError as exc:
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
        audit(locked, "escrow_released_to_payout", actor=actor, source=source, old=old, new=locked.state, metadata={"payout_reference": reference, "commission": str(locked.commission_amount), "provider_amount": str(locked.provider_amount)})
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
            locked.cancelled_at = timezone.now()
            locked.save(update_fields=["state", "cancelled_at", "updated_at"])
            PaymentAttempt.objects.filter(transaction=locked, status=PaymentAttempt.Status.INITIALIZED).update(status=PaymentAttempt.Status.ABANDONED, completed_at=timezone.now())
            audit(locked, "unfunded_booking_cancelled", actor=actor, source="booking", old=old, new=locked.state)
            return locked
        if locked.state in {Transaction.State.FUNDED, Transaction.State.IN_PROGRESS, Transaction.State.DELIVERED, Transaction.State.RELEASED, Transaction.State.DISPUTED}:
            raise ValidationError("This booking has SabiPay funds. Use the controlled refund/dispute process instead of direct cancellation.")
        return locked


def request_refund(tx, *, actor, reason):
    if not (actor.is_staff and (actor.is_superuser or actor.has_perm("sabipay.manage_sabipay"))):
        raise PermissionDenied("Only an authorised SabiPay operator can initiate refunds.")
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().get(pk=tx.pk)
        if locked.state != Transaction.State.FUNDED or locked.booking.status not in {BookingRequest.Status.ACCEPTED, BookingRequest.Status.CANCELLED}:
            raise ValidationError("Phase 7 controlled refunds are limited to funded bookings before service commencement.")
        if locked.refund_status == Transaction.RefundStatus.PENDING:
            return locked
        try:
            data = gateway.initiate_refund(
                transaction_reference=locked.funding_reference,
                amount_subunit=amount_to_subunit(locked.amount),
                reason=reason or "Approved SabiWay cancellation refund",
            )
        except gateway.PaystackError as exc:
            locked.refund_status = Transaction.RefundStatus.FAILED
            locked.refund_reason = str(exc)
            locked.save(update_fields=["refund_status", "refund_reason", "updated_at"])
            audit(locked, "refund_initiation_failed", actor=actor, source="admin", reason=str(exc))
            raise ValidationError(str(exc)) from exc
        locked.refund_status = Transaction.RefundStatus.PENDING
        locked.refund_gateway_id = str(data.get("id") or "")
        locked.refund_reason = reason
        locked.save(update_fields=["refund_status", "refund_gateway_id", "refund_reason", "updated_at"])
        audit(locked, "refund_initiated", actor=actor, source="admin", reason=reason, metadata={"gateway_refund_id": locked.refund_gateway_id})
        if str(data.get("status") or "").lower() in {"processed", "success"}:
            return mark_refunded(locked, source="gateway")
        return locked


def mark_refunded(tx, *, source="gateway", event_key=None):
    with db_transaction.atomic():
        locked = Transaction.objects.select_for_update().get(pk=tx.pk)
        if locked.state == Transaction.State.REFUNDED:
            return locked
        if locked.state not in {Transaction.State.FUNDED, Transaction.State.DISPUTED}:
            return locked
        old = locked.state
        locked.state = Transaction.State.REFUNDED
        locked.refund_status = Transaction.RefundStatus.PROCESSED
        locked.refunded_at = timezone.now()
        locked.save(update_fields=["state", "refund_status", "refunded_at", "updated_at"])
        audit(locked, "refund_processed", source=source, old=old, new=locked.state, event_key=event_key)
        return locked


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
                verified = gateway.verify_payment(reference)
                _fund_attempt(attempt, verified, source="gateway", event_key=f"webhook:{digest}")
                note = "funding processed"
            else:
                note = "unknown payment reference"
        elif event_name.startswith("transfer."):
            payout = PayoutRecord.objects.select_related("transaction").filter(reference=reference).first()
            if payout:
                status_map = {
                    "transfer.success": PayoutRecord.Status.PAID,
                    "transfer.failed": PayoutRecord.Status.FAILED,
                    "transfer.reversed": PayoutRecord.Status.REVERSED,
                }
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
    if not latest_attempt:
        tx.reconciliation_status = Transaction.ReconciliationStatus.PENDING
        tx.reconciliation_note = "No payment attempt exists yet."
        tx.reconciled_at = timezone.now()
        tx.save(update_fields=["reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
        return tx
    try:
        data = gateway.verify_payment(latest_attempt.reference)
    except gateway.PaystackError as exc:
        tx.reconciliation_status = Transaction.ReconciliationStatus.MISMATCH
        tx.reconciliation_note = str(exc)
        tx.reconciled_at = timezone.now()
        tx.save(update_fields=["reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
        return tx
    gateway_success = data.get("status") == "success" and int(data.get("amount") or 0) == amount_to_subunit(tx.amount) and (data.get("currency") or "").upper() == tx.currency
    if gateway_success and tx.state == Transaction.State.PENDING_PAYMENT:
        return _fund_attempt(latest_attempt, data, source="reconciliation")
    expected_funded = tx.state not in {Transaction.State.PENDING_PAYMENT, Transaction.State.CANCELLED}
    tx.reconciliation_status = Transaction.ReconciliationStatus.MATCHED if gateway_success == expected_funded else Transaction.ReconciliationStatus.MISMATCH
    tx.reconciliation_note = "Gateway funding status reconciled." if tx.reconciliation_status == Transaction.ReconciliationStatus.MATCHED else "Gateway funding status differs from the SabiPay ledger."
    tx.reconciled_at = timezone.now()
    tx.save(update_fields=["reconciliation_status", "reconciliation_note", "reconciled_at", "updated_at"])
    return tx
