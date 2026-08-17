from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import User
from marketplace.models import BookingAudit, BookingRequest, Message
from notifications.models import Notification
from posts.models import ModerationAudit, Post
from profiles.models import Profile
from sabipay.models import Transaction, TransactionAudit
from verification.models import VerificationAudit, VerificationSubmission

from .analytics import record_product_event, record_technical_metric
from .models import ProductEvent
from .services import record_operations_audit


def _user_from_actor(actor):
    if actor is None:
        return None
    if hasattr(actor, "email"):
        return actor
    return getattr(actor, "user", None)


def _record_once(event_name, actor, *, properties=None):
    if not actor:
        return None
    if ProductEvent.objects.filter(event_name=event_name, actor=actor).exists():
        return None
    return record_product_event(event_name, actor=actor, properties=properties)


@receiver(post_save, sender=User, dispatch_uid="operations.measure_user_lifecycle")
def measure_user_lifecycle(sender, instance, created, **kwargs):
    if created:
        record_product_event("registration_completed", actor=instance, properties={"role": instance.role})
    if instance.onboarding_completed_at:
        _record_once("onboarding_completed", instance, properties={"role": instance.role})


@receiver(post_save, sender=Profile, dispatch_uid="operations.measure_profile_completion")
def measure_profile_completion(sender, instance, created, **kwargs):
    user = getattr(instance, "user", None)
    if user and instance.full_name and instance.username and instance.role:
        _record_once("profile_completed", user, properties={"role": instance.role})


@receiver(post_save, sender=VerificationSubmission, dispatch_uid="operations.measure_verification")
def measure_verification(sender, instance, created, **kwargs):
    user = getattr(instance.professional, "user", None)
    if created:
        record_product_event("verification_started", actor=user, properties={"verification_status": instance.status})
    if instance.status == VerificationSubmission.Status.APPROVED:
        _record_once("verification_completed", user, properties={"verification_status": instance.status})


@receiver(post_save, sender=Post, dispatch_uid="operations.measure_post_created")
def measure_post_created(sender, instance, created, **kwargs):
    if created:
        record_product_event("post_created", actor=getattr(instance.author, "user", None))


@receiver(post_save, sender=Message, dispatch_uid="operations.measure_message_sent")
def measure_message_sent(sender, instance, created, **kwargs):
    if created:
        record_product_event("message_sent", actor=getattr(instance.sender, "user", None))


@receiver(post_save, sender=BookingRequest, dispatch_uid="operations.measure_booking_funnel")
def measure_booking_funnel(sender, instance, created, **kwargs):
    actor = getattr(instance.client, "user", None)
    if created:
        record_product_event("transaction_started", actor=actor, properties={"booking_status": instance.status})
    if instance.status == BookingRequest.Status.COMPLETED:
        _record_once("transaction_completed", actor, properties={"booking_status": instance.status})


@receiver(post_save, sender=Transaction, dispatch_uid="operations.measure_payment_state")
def measure_payment_state(sender, instance, created, **kwargs):
    actor = getattr(instance.client, "user", None)
    if instance.payment_status == Transaction.PaymentStatus.SUCCEEDED:
        _record_once("payment_completed", actor, properties={"payment_status": instance.payment_status})
    elif instance.payment_status in {Transaction.PaymentStatus.FAILED, Transaction.PaymentStatus.ABANDONED, Transaction.PaymentStatus.MISMATCH}:
        record_technical_metric("payment_provider", success=False, actor=actor, metadata={"payment_status": instance.payment_status})


@receiver(post_save, sender=Notification, dispatch_uid="operations.measure_notifications")
def measure_notification(sender, instance, created, **kwargs):
    if created:
        record_product_event("notification_created", actor=getattr(instance.user, "user", None), properties={"notification_type": instance.type})


@receiver(post_save, sender=VerificationAudit, dispatch_uid="operations.mirror_verification_audit")
def mirror_verification_audit(sender, instance, created, **kwargs):
    if not created: return
    record_operations_audit(actor=_user_from_actor(instance.actor),action=f"verification:{instance.event}",target_type="verification_submission",target_id=instance.submission_id,previous_state={"status":instance.from_status},new_state={"status":instance.to_status},metadata={"reason":instance.reason,"domain_audit_id":str(instance.pk)})


@receiver(post_save, sender=ModerationAudit, dispatch_uid="operations.mirror_moderation_audit")
def mirror_moderation_audit(sender, instance, created, **kwargs):
    if not created: return
    record_operations_audit(actor=_user_from_actor(instance.actor),action=f"moderation:{instance.action}",target_type="post",target_id=instance.post_id,metadata={"report_id":instance.report_id,"note":instance.note,"domain_audit_id":instance.pk})


@receiver(post_save, sender=BookingAudit, dispatch_uid="operations.mirror_booking_audit")
def mirror_booking_audit(sender, instance, created, **kwargs):
    if not created: return
    record_operations_audit(actor=_user_from_actor(instance.actor),action=f"booking:{instance.event}",target_type="booking",target_id=instance.booking_id,previous_state={"status":instance.from_status},new_state={"status":instance.to_status},metadata={"domain_metadata":instance.metadata,"domain_audit_id":instance.pk})


@receiver(post_save, sender=TransactionAudit, dispatch_uid="operations.mirror_transaction_audit")
def mirror_transaction_audit(sender, instance, created, **kwargs):
    if not created: return
    record_operations_audit(actor=_user_from_actor(instance.actor),action=f"sabipay:{instance.event}",target_type="sabipay_transaction",target_id=instance.transaction_id,previous_state={"state":instance.from_state},new_state={"state":instance.to_state},metadata={"source":instance.source,"reason":instance.reason,"domain_metadata":instance.metadata,"domain_audit_id":str(instance.pk)})
