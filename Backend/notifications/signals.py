from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from marketplace.models import BookingRequest, Message
from posts.models import Comment, Like, Post, Reply
from profiles.models import Follow
from sabipay.models import Transaction
from verification.models import VerificationSubmission

from .services import notify


def safe_profile(profile_obj):
    if profile_obj and getattr(profile_obj, "user", None):
        return profile_obj
    return None


def _remember_previous(sender, instance, **kwargs):
    if not instance.pk:
        instance._phase8_previous_status = None
        return
    field = "state" if sender is Transaction else "status"
    instance._phase8_previous_status = sender.objects.filter(pk=instance.pk).values_list(field, flat=True).first()


@receiver(post_save, sender=Follow)
def new_follower(sender, instance, created, **kwargs):
    if created:
        notify(user=safe_profile(instance.following), actor=safe_profile(instance.follower), notif_type="follow", target=instance.follower, message=f"{instance.follower.username} started following you.", deep_link=f"/profile/{instance.follower.username}", event_key=f"follow:{instance.pk}", email=False)


@receiver(post_save, sender=Like)
def new_like(sender, instance, created, **kwargs):
    if created:
        notify(user=safe_profile(instance.post.author), actor=safe_profile(instance.user), notif_type="like", target=instance.post, message=f"{instance.user.username} liked your post.", deep_link=f"/posts/{instance.post_id}", event_key=f"like:{instance.pk}", email=False)


@receiver(post_save, sender=Comment)
def new_comment(sender, instance, created, **kwargs):
    if created:
        notify(user=safe_profile(instance.post.author), actor=safe_profile(instance.user), notif_type="comment", target=instance, message=f"{instance.user.username} commented on your post.", deep_link=f"/posts/{instance.post_id}", event_key=f"comment:{instance.pk}", email=False)


@receiver(post_save, sender=Reply)
def new_reply(sender, instance, created, **kwargs):
    if not created:
        return
    recipients = []
    if instance.parent_reply:
        recipients.append(instance.parent_reply.user)
    if instance.comment:
        recipients.append(instance.comment.user)
    seen = set()
    for recipient in recipients:
        profile = safe_profile(recipient)
        if not profile or profile.user_id in seen:
            continue
        seen.add(profile.user_id)
        notify(user=profile, actor=safe_profile(instance.user), notif_type="reply", target=instance, message=f"{instance.user.username} replied to your comment.", deep_link=f"/posts/{instance.comment.post_id}", event_key=f"reply:{instance.pk}:{profile.user_id}", email=False)


@receiver(post_save, sender=Post)
def notify_followers_new_post(sender, instance, created, **kwargs):
    if not created:
        return
    followers = Follow.objects.filter(following=instance.author).select_related("follower__user")
    for follow in followers:
        notify(user=safe_profile(follow.follower), actor=safe_profile(instance.author), notif_type="post", target=instance, message=f"{instance.author.username} shared a new post.", deep_link=f"/posts/{instance.pk}", event_key=f"post:{instance.pk}:{follow.follower_id}", email=False)


@receiver(post_save, sender=Message)
def marketplace_message_notification(sender, instance, created, **kwargs):
    if not created or instance.is_system:
        return
    thread = instance.thread
    recipient = thread.professional if instance.sender_id == thread.client_id else thread.client
    notify(
        user=recipient,
        actor=instance.sender,
        notif_type="message",
        target=thread,
        message=f"New message from {instance.sender.full_name}.",
        deep_link=f"/messages?thread={thread.id}",
        event_key=f"message:{instance.pk}",
        email=True,
        push=True,
    )


@receiver(pre_save, sender=BookingRequest)
def booking_previous_state(sender, instance, **kwargs):
    _remember_previous(sender, instance, **kwargs)


@receiver(post_save, sender=BookingRequest)
def booking_notification(sender, instance, created, **kwargs):
    previous = getattr(instance, "_phase8_previous_status", None)
    if not created and previous == instance.status:
        return
    actor = None
    recipient = instance.professional if created else None
    if not created and instance.professional:
        # Status changes can originate from either party. The authoritative event is still persisted even
        # when the exact actor is unavailable from a model signal.
        recipient = instance.client if instance.status in {BookingRequest.Status.ACCEPTED, BookingRequest.Status.DECLINED} else instance.professional
    if not recipient:
        return
    label = instance.status.replace("_", " ")
    notify(
        user=recipient,
        actor=actor,
        notif_type="booking",
        target=instance,
        message=f"Booking update: {label}.",
        deep_link="/messages",
        event_key=f"booking:{instance.pk}:{instance.status}:{instance.updated_at.isoformat() if instance.updated_at else 'new'}",
        metadata={"booking_id": str(instance.pk), "status": instance.status},
        email=True,
        push=True,
    )


@receiver(pre_save, sender=VerificationSubmission)
def verification_previous_state(sender, instance, **kwargs):
    _remember_previous(sender, instance, **kwargs)


@receiver(post_save, sender=VerificationSubmission)
def verification_notification(sender, instance, created, **kwargs):
    previous = getattr(instance, "_phase8_previous_status", None)
    if created or previous == instance.status:
        return
    notify(
        user=instance.professional,
        notif_type="verification",
        target=instance,
        message=f"Verification update: {instance.get_status_display()}.",
        deep_link="/verification",
        event_key=f"verification:{instance.pk}:{instance.version}:{instance.status}",
        metadata={"status": instance.status, "version": instance.version},
        email=True,
        push=True,
    )


@receiver(pre_save, sender=Transaction)
def transaction_previous_state(sender, instance, **kwargs):
    _remember_previous(sender, instance, **kwargs)


@receiver(post_save, sender=Transaction)
def transaction_notification(sender, instance, created, **kwargs):
    previous = getattr(instance, "_phase8_previous_status", None)
    if created or previous == instance.state:
        return
    state = instance.state
    message_map = {
        Transaction.State.FUNDED: "Payment confirmed. Funds are secured in SabiPay escrow.",
        Transaction.State.IN_PROGRESS: "The funded service is now in progress.",
        Transaction.State.DELIVERED: "Service marked delivered. The 7-day SabiPay freeze period has started.",
        Transaction.State.DISPUTED: "This SabiPay transaction is frozen while a dispute is reviewed.",
        Transaction.State.RELEASED: "SabiPay escrow has been released according to the authorised outcome.",
        Transaction.State.REFUNDED: "Your SabiPay transaction has been refunded according to the authorised outcome.",
        Transaction.State.CANCELLED: "This SabiPay transaction was cancelled before funding.",
    }
    message = message_map.get(state)
    if not message:
        return
    for recipient in (instance.client, instance.professional):
        notify(
            user=recipient,
            notif_type="payment",
            target=instance,
            message=message,
            deep_link="/sabipay",
            event_key=f"payment:{instance.pk}:{state}:{recipient.user_id}",
            metadata={"transaction_id": str(instance.pk), "state": state, "receipt_number": instance.receipt_number},
            email=True,
            push=True,
        )
