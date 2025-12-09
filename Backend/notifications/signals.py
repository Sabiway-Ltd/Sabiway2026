# notifications/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from profiles.models import Follow
from posts.models import Like, Comment, Reply, Post
from .models import Notification
from .serializers import NotificationSerializer
from django.conf import settings
import requests

# -------------------
# HELPER: SAFE PROFILE
# -------------------
def safe_profile(profile_obj):
    """Return profile_obj only if it has a valid user, else None."""
    if profile_obj and getattr(profile_obj, "user", None):
        return profile_obj
    print(f"⚠️ Skipping invalid profile: {profile_obj}")
    return None

# -------------------
# HELPER: CREATE NOTIFICATION WITH REAL-TIME
# -------------------
def create_notification(user, actor, notif_type, target=None):
    """Create notification and broadcast it in real-time."""
    if not user or not actor or user.user.id == actor.user.id:
        return

    target_ct = ContentType.objects.get_for_model(target) if target else None
    target_id = str(target.pk) if target else None

    messages = {
        "follow": f"{actor.username} started following you.",
        "like": f"{actor.username} liked your post.",
        "comment": f"{actor.username} commented on your post.",
        "reply": f"{actor.username} replied to your comment.",
        "post": f"{actor.username} shared a new post."
    }

    notif = Notification.objects.create(
        user=user,
        actor=actor,
        type=notif_type,
        target_content_type=target_ct,
        target_object_id=target_id,
        message=messages.get(notif_type)
    )

    # Serialize and safely convert UUIDs
    serializer = NotificationSerializer(notif)
    def convert_uuids_to_str(obj):
        if isinstance(obj, dict):
            return {k: convert_uuids_to_str(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_uuids_to_str(i) for i in obj]
        return str(obj) if hasattr(obj, "hex") else obj
    notif_data_safe = convert_uuids_to_str(serializer.data)

    # Broadcast via Socket.io
    try:
        resp = requests.post(
            f"{settings.EXPRESS_URL}/broadcast-notification",
            json={"userId": str(user.user.id), "notification": notif_data_safe},
            timeout=2
        )
        if resp.status_code == 200:
            print(f"✅ Real-time notification sent to user {user.user.id} ({notif_type})")
        else:
            print(f"⚠️ Failed to send notification: {resp.text}")
    except Exception as e:
        print("⚠️ Real-time notification broadcast failed:", str(e))


# -------------------
# SIGNALS
# -------------------

@receiver(post_save, sender=Follow)
def new_follower(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=safe_profile(instance.following),
            actor=safe_profile(instance.follower),
            notif_type="follow",
            target=instance.follower
        )

@receiver(post_save, sender=Like)
def new_like(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=safe_profile(instance.post.author),
            actor=safe_profile(instance.user),
            notif_type="like",
            target=instance.post
        )

@receiver(post_save, sender=Comment)
def new_comment(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=safe_profile(instance.post.author),
            actor=safe_profile(instance.user),
            notif_type="comment",
            target=instance
        )

@receiver(post_save, sender=Reply)
def new_reply(sender, instance, created, **kwargs):
    if not created:
        return
    # Notify parent reply owner
    if instance.parent_reply:
        create_notification(
            user=safe_profile(instance.parent_reply.user),
            actor=safe_profile(instance.user),
            notif_type="reply",
            target=instance
        )
    # Notify comment owner
    if instance.comment:
        create_notification(
            user=safe_profile(instance.comment.user),
            actor=safe_profile(instance.user),
            notif_type="reply",
            target=instance
        )

@receiver(post_save, sender=Post)
def notify_followers_new_post(sender, instance, created, **kwargs):
    if created:
        followers = [f.follower for f in instance.author.followers_rel.all() if safe_profile(f.follower)]
        for follower in followers:
            create_notification(
                user=follower,
                actor=safe_profile(instance.author),
                notif_type="post",
                target=instance
            )
