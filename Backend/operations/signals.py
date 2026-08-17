from django.db.models.signals import post_save
from django.dispatch import receiver

from marketplace.models import BookingAudit
from posts.models import ModerationAudit
from sabipay.models import TransactionAudit
from verification.models import VerificationAudit

from .services import record_operations_audit


def _user_from_actor(actor):
    if actor is None:
        return None
    if hasattr(actor, "email"):
        return actor
    return getattr(actor, "user", None)


@receiver(post_save, sender=VerificationAudit, dispatch_uid="operations.mirror_verification_audit")
def mirror_verification_audit(sender, instance, created, **kwargs):
    if not created:
        return
    record_operations_audit(
        actor=_user_from_actor(instance.actor),
        action=f"verification:{instance.event}",
        target_type="verification_submission",
        target_id=instance.submission_id,
        previous_state={"status": instance.from_status},
        new_state={"status": instance.to_status},
        metadata={"reason": instance.reason, "domain_audit_id": str(instance.pk)},
    )


@receiver(post_save, sender=ModerationAudit, dispatch_uid="operations.mirror_moderation_audit")
def mirror_moderation_audit(sender, instance, created, **kwargs):
    if not created:
        return
    record_operations_audit(
        actor=_user_from_actor(instance.actor),
        action=f"moderation:{instance.action}",
        target_type="post",
        target_id=instance.post_id,
        metadata={"report_id": instance.report_id, "note": instance.note, "domain_audit_id": instance.pk},
    )


@receiver(post_save, sender=BookingAudit, dispatch_uid="operations.mirror_booking_audit")
def mirror_booking_audit(sender, instance, created, **kwargs):
    if not created:
        return
    record_operations_audit(
        actor=_user_from_actor(instance.actor),
        action=f"booking:{instance.event}",
        target_type="booking",
        target_id=instance.booking_id,
        previous_state={"status": instance.from_status},
        new_state={"status": instance.to_status},
        metadata={"domain_metadata": instance.metadata, "domain_audit_id": instance.pk},
    )


@receiver(post_save, sender=TransactionAudit, dispatch_uid="operations.mirror_transaction_audit")
def mirror_transaction_audit(sender, instance, created, **kwargs):
    if not created:
        return
    record_operations_audit(
        actor=_user_from_actor(instance.actor),
        action=f"sabipay:{instance.event}",
        target_type="sabipay_transaction",
        target_id=instance.transaction_id,
        previous_state={"state": instance.from_state},
        new_state={"state": instance.to_state},
        metadata={"source": instance.source, "reason": instance.reason, "domain_metadata": instance.metadata, "domain_audit_id": str(instance.pk)},
    )
