# notifications/signals.py
import os
import requests
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_save
from django.dispatch import receiver

from profiles.models import Follow
from posts.models import Like, Comment, Reply, Post
from .models import Notification
from .serializers import NotificationSerializer


def safe_profile(profile_obj):
    """Return profile_obj only if it has a valid user, else None."""
    if profile_obj and getattr(profile_obj, "user", None):
        return profile_obj
    return None


def _realtime_headers():
    token = os.environ.get("INTERNAL_BROADCAST_TOKEN", "")
    return {"x-sabiway-internal-token": token} if token else {}


def create_notification(user, actor, notif_type, target=None):
    """Create a notification and best-effort broadcast it in realtime."""
    if not user or not actor or user.user.id == actor.user.id:
        return None

    target_ct = ContentType.objects.get_for_model(target) if target else None
    target_id = str(target.pk) if target else None

    messages = {
        "follow": f"{actor.username} started following you.",
        "like": f"{actor.username} liked your post.",
        "comment": f"{actor.username} commented on your post.",
        "reply": f"{actor.username} replied to your comment.",
        "post": f"{actor.username} shared a new post.",
    }

    notif = Notification.objects.create(
        user=user,
        actor=actor,
        type=notif_type,
        target_content_type=target_ct,
        target_object_id=target_id,
        message=messages.get(notif_type),
    )

    serializer = NotificationSerializer(notif)

    def convert_uuids_to_str(obj):
        if isinstance(obj, dict):
            return {k: convert_uuids_to_str(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [convert_uuids_to_str(i) for i in obj]
        return str(obj) if hasattr(obj, "hex") else obj

    notif_data_safe = convert_uuids_to_str(serializer.data)

    try:
        requests.post(
            f"{settings.EXPRESS_URL}/broadcast-notification",
            json={"userId": str(user.user.id), "notification": notif_data_safe},
            headers=_realtime_headers(),
            timeout=2,
        )
    except requests.RequestException:
        # Persistence is authoritative; realtime delivery is best effort.
        pass

    return notif


@receiver(post_save, sender=Follow)
def new_follower(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=safe_profile(instance.following),
            actor=safe_profile(instance.follower),
            notif_type="follow",
            target=instance.follower,
        )


@receiver(post_save, sender=Like)
def new_like(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=safe_profile(instance.post.author),
            actor=safe_profile(instance.user),
            notif_type="like",
            target=instance.post,
        )


@receiver(post_save, sender=Comment)
def new_comment(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=safe_profile(instance.post.author),
            actor=safe_profile(instance.user),
            notif_type="comment",
            target=instance,
        )


@receiver(post_save, sender=Reply)
def new_reply(sender, instance, created, **kwargs):
    if not created:
        return

    recipients = []
    if instance.parent_reply:
        recipients.append(instance.parent_reply.user)
    if instance.comment:
        recipients.append(instance.comment.user)

    seen_user_ids = set()
    for recipient in recipients:
        profile = safe_profile(recipient)
        if not profile or profile.user_id in seen_user_ids:
            continue
        seen_user_ids.add(profile.user_id)
        create_notification(
            user=profile,
            actor=safe_profile(instance.user),
            notif_type="reply",
            target=instance,
        )


@receiver(post_save, sender=Post)
def notify_followers_new_post(sender, instance, created, **kwargs):
    if not created:
        return

    followers = (
        Follow.objects.filter(following=instance.author)
        .select_related("follower__user")
    )
    for follow in followers:
        create_notification(
            user=safe_profile(follow.follower),
            actor=safe_profile(instance.author),
            notif_type="post",
            target=instance,
        )
