from datetime import timedelta

from django.conf import settings
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from marketplace.models import BookingRequest

from .models import Transaction
from .services import audit


def _existing_transaction(booking):
    return Transaction.objects.filter(booking=booking).first()


@receiver(pre_save, sender=BookingRequest)
def protect_funded_booking_transitions(sender, instance, **kwargs):
    if not instance.pk:
        return
    previous = BookingRequest.objects.filter(pk=instance.pk).values_list("status", flat=True).first()
    if previous == instance.status:
        return
    tx = _existing_transaction(instance)
    if instance.status == BookingRequest.Status.IN_PROGRESS:
        if not tx or tx.state not in {Transaction.State.FUNDED, Transaction.State.IN_PROGRESS}:
            raise ValidationError("Service cannot start until SabiPay confirms escrow funding.")
    elif instance.status == BookingRequest.Status.COMPLETED:
        if not tx or tx.state not in {Transaction.State.IN_PROGRESS, Transaction.State.DELIVERED}:
            raise ValidationError("Service cannot be marked complete before funded work is in progress.")
    elif instance.status == BookingRequest.Status.CANCELLED and tx:
        if tx.state not in {Transaction.State.PENDING_PAYMENT, Transaction.State.CANCELLED, Transaction.State.REFUNDED}:
            raise ValidationError("This booking has SabiPay funds. Use the controlled refund/dispute process.")


@receiver(post_save, sender=BookingRequest)
def mirror_booking_progress_into_sabipay(sender, instance, created, **kwargs):
    if created:
        return
    tx = _existing_transaction(instance)
    if not tx:
        return
    now = timezone.now()
    if instance.status == BookingRequest.Status.IN_PROGRESS and tx.state == Transaction.State.FUNDED:
        old = tx.state
        tx.state = Transaction.State.IN_PROGRESS
        tx.service_started_at = now
        tx.save(update_fields=["state", "service_started_at", "updated_at"])
        audit(tx, "service_started_from_booking", source="booking", old=old, new=tx.state)
    elif instance.status == BookingRequest.Status.COMPLETED and tx.state == Transaction.State.IN_PROGRESS:
        old = tx.state
        tx.state = Transaction.State.DELIVERED
        tx.delivered_at = now
        tx.release_eligible_at = now + timedelta(days=int(getattr(settings, "SABIPAY_FREEZE_DAYS", 7)))
        tx.save(update_fields=["state", "delivered_at", "release_eligible_at", "updated_at"])
        audit(tx, "service_delivered_freeze_started_from_booking", source="booking", old=old, new=tx.state, metadata={"release_eligible_at": tx.release_eligible_at.isoformat()})
    elif instance.status == BookingRequest.Status.CANCELLED and tx.state == Transaction.State.PENDING_PAYMENT:
        old = tx.state
        tx.state = Transaction.State.CANCELLED
        tx.cancelled_at = now
        tx.save(update_fields=["state", "cancelled_at", "updated_at"])
        audit(tx, "unfunded_booking_cancelled", source="booking", old=old, new=tx.state)
