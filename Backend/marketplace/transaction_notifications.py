from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_save
from django.dispatch import receiver

from notifications.models import Notification
from notifications.realtime import broadcast_notification
from notifications.serializers import NotificationSerializer

from .models import BookingAudit


STATUS_MESSAGES = {
    "pending": "A booking summary is waiting for professional confirmation.",
    "accepted": "Your SabiWay booking was accepted.",
    "declined": "The booking was declined. You can return to the conversation and agree different terms.",
    "cancelled": "The booking was cancelled.",
    "in_progress": "Work on this booking is now in progress.",
    "completed": "This booking was marked completed.",
}


def _recipient(booking, actor):
    if not actor:
        return None
    return booking.professional if actor.pk == booking.client_id else booking.client


def _safe_payload(notification):
    def convert(value):
        if isinstance(value, dict):
            return {key: convert(item) for key, item in value.items()}
        if isinstance(value, list):
            return [convert(item) for item in value]
        return str(value) if hasattr(value, "hex") else value

    return convert(NotificationSerializer(notification).data)


@receiver(post_save, sender=BookingAudit)
def notify_booking_audit(sender, instance, created, **kwargs):
    """Persist one user-facing notification for each auditable transaction event.

    BookingAudit is written only after the marketplace API has authorised an action,
    so it gives us both the actor and the authoritative state transition without
    duplicating permission logic inside notification signals.
    """
    if not created or not instance.actor:
        return

    booking = instance.booking
    recipient = _recipient(booking, instance.actor)
    if not recipient:
        return

    if instance.event == "booking_created":
        message = "A booking summary was created. Review the agreed scope, price and schedule before confirming."
    elif instance.event == "status_changed":
        message = STATUS_MESSAGES.get(instance.to_status, f"Your booking changed to {instance.to_status.replace('_', ' ')}.")
    elif instance.event == "schedule_proposed":
        message = "A new booking time was proposed. Review it in Messages."
    elif instance.event == "schedule_decision":
        decision = str(instance.metadata.get("decision", "updated")).replace("_", " ")
        message = f"The booking schedule was {decision}."
    else:
        return

    notification = Notification.objects.create(
        user=recipient,
        actor=instance.actor,
        type="booking",
        target_content_type=ContentType.objects.get_for_model(booking),
        target_object_id=str(booking.pk),
        message=message,
    )
    broadcast_notification(recipient.user_id, _safe_payload(notification))
