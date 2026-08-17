from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_save
from django.dispatch import receiver

from notifications.models import Notification
from notifications.realtime import broadcast_notification
from notifications.serializers import NotificationSerializer

from .models import TransactionAudit


PAYMENT_EVENTS = {
    "checkout_initialization_failed": "SabiPay could not start checkout. You can safely try again.",
    "payment_status_checked": "Your SabiPay payment status has been updated.",
    "payment_verification_deferred": "Payment confirmation is still pending. SabiPay will keep the transaction safe while status is checked.",
    "funding_mismatch": "SabiPay found a payment mismatch. Funds will not be treated as confirmed until reviewed.",
    "duplicate_successful_charge_detected": "SabiPay detected a possible duplicate successful charge and flagged it for review.",
    "escrow_funded": "Payment confirmed. SabiPay is holding the booking funds for the service journey.",
    "refund_initiated": "A SabiPay refund has been initiated.",
    "refund_processed": "Your SabiPay refund has been processed.",
    "payout_initiation_failed": "Provider payout needs attention. SabiPay has kept the transaction auditable.",
    "escrow_released_to_payout": "SabiPay has released the provider payment.",
}

DISPUTE_EVENTS = {
    "dispute_opened": "A dispute has been opened and the transaction is frozen while it is reviewed.",
    "dispute_evidence_added": "New evidence was added to a SabiPay dispute.",
    "dispute_review_started": "SabiWay has started reviewing the dispute.",
    "dispute_resolved_resume": "The dispute was resolved and the transaction can continue.",
    "dispute_resolved_refund": "The dispute decision approved a client refund.",
    "dispute_resolved_release": "The dispute decision approved provider payment release.",
}


def _actor_profile(actor):
    if not actor:
        return None
    try:
        return actor.profile
    except Exception:
        return None


def _broadcast(notification):
    payload = NotificationSerializer(notification).data

    def convert(value):
        if isinstance(value, dict):
            return {key: convert(item) for key, item in value.items()}
        if isinstance(value, list):
            return [convert(item) for item in value]
        return str(value) if hasattr(value, "hex") else value

    broadcast_notification(notification.user.user_id, convert(payload))


@receiver(post_save, sender=TransactionAudit)
def notify_sabipay_event(sender, instance, created, **kwargs):
    if not created:
        return
    message = PAYMENT_EVENTS.get(instance.event)
    notification_type = "payment"
    if instance.event in DISPUTE_EVENTS:
        message = DISPUTE_EVENTS[instance.event]
        notification_type = "dispute"
    if not message:
        return

    tx = instance.transaction
    actor_profile = _actor_profile(instance.actor)
    recipients = [tx.client, tx.professional]
    target_ct = ContentType.objects.get_for_model(tx)
    for recipient in recipients:
        if actor_profile and recipient.pk == actor_profile.pk and instance.event not in {
            "payment_verification_deferred",
            "funding_mismatch",
            "duplicate_successful_charge_detected",
        }:
            continue
        notification = Notification.objects.create(
            user=recipient,
            actor=actor_profile,
            type=notification_type,
            target_content_type=target_ct,
            target_object_id=str(tx.pk),
            message=message,
        )
        _broadcast(notification)
