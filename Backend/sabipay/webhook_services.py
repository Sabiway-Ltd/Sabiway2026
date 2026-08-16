import hashlib

from django.utils import timezone

from . import gateway
from .models import GatewayWebhookEvent, PaymentAttempt, PayoutRecord, Transaction
from .services import _fund_attempt, audit, mark_refunded


def process_paystack_webhook(raw_body, payload):
    """Process one verified Paystack event without swallowing transient gateway failures.

    A raw-body digest is the delivery idempotency key. Events are only marked processed after
    their state-safe handler succeeds or when the event is permanently irrelevant to SabiPay.
    A transient Paystack API failure leaves processed=False so the gateway delivery can retry.
    """
    digest = hashlib.sha256(raw_body).hexdigest()
    event_name = str(payload.get("event") or "")
    data = payload.get("data") or {}
    reference = str(data.get("reference") or "")
    webhook, created = GatewayWebhookEvent.objects.get_or_create(
        digest=digest,
        defaults={"event_name": event_name, "reference": reference},
    )
    if not created and webhook.processed:
        return webhook

    note = "ignored"
    try:
        if event_name == "charge.success":
            attempt = PaymentAttempt.objects.select_related("transaction").filter(reference=reference).first()
            if not attempt:
                note = "unknown payment reference"
            else:
                verified = gateway.verify_payment(reference)
                _fund_attempt(attempt, verified, source="gateway", event_key=f"webhook:{digest}")
                note = "funding processed"
        elif event_name.startswith("transfer."):
            payout = PayoutRecord.objects.select_related("transaction").filter(reference=reference).first()
            if not payout:
                note = "unknown payout reference"
            else:
                status_map = {
                    "transfer.success": PayoutRecord.Status.PAID,
                    "transfer.failed": PayoutRecord.Status.FAILED,
                    "transfer.reversed": PayoutRecord.Status.REVERSED,
                }
                next_status = status_map.get(event_name)
                if next_status:
                    payout.status = next_status
                    if next_status == PayoutRecord.Status.PAID:
                        payout.completed_at = timezone.now()
                        payout.failure_reason = ""
                    else:
                        payout.failure_reason = str(data.get("reason") or data.get("message") or "")
                    payout.save(update_fields=["status", "completed_at", "failure_reason", "updated_at"])
                    audit(
                        payout.transaction,
                        event_name.replace(".", "_"),
                        source="gateway",
                        metadata={"payout_reference": reference},
                        event_key=f"webhook:{digest}",
                    )
                    note = "payout status processed"
                else:
                    note = "unsupported transfer event"
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
            else:
                note = "unknown refund transaction"
        else:
            note = "event not used by Phase 7"
    except gateway.PaystackError as exc:
        webhook.processed = False
        webhook.processing_note = f"retryable gateway error: {exc}"
        webhook.processed_at = None
        webhook.save(update_fields=["processed", "processing_note", "processed_at"])
        raise

    webhook.processed = True
    webhook.processing_note = note
    webhook.processed_at = timezone.now()
    webhook.save(update_fields=["processed", "processing_note", "processed_at"])
    return webhook
