# notifications/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from profiles.models import Follow
from posts.models import Like, Comment, Reply, Post
from .models import Notification

def create_notification(user, actor, notif_type, target=None):
    """
    Create a notification for the user if they are not the actor.
    Automatically generates a message if not provided.
    """
    if user != actor:
        target_ct = ContentType.objects.get_for_model(target) if target else None
        target_id = str(target.pk) if target else None

        # Generate default message
        if notif_type == "follow":
            message = f"{actor.username} started following you."
        elif notif_type == "like":
            message = f"{actor.username} liked your post."
        elif notif_type == "comment":
            message = f"{actor.username} commented on your post."
        elif notif_type == "reply":
            message = f"{actor.username} replied to your comment."
        elif notif_type == "post":
            message = f"{actor.username} shared a new post."
        else:
            message = None

        Notification.objects.create(
            user=user,
            actor=actor,
            type=notif_type,
            target_content_type=target_ct,
            target_object_id=target_id,
            message=message
        )

# -------------------
# FOLLOW
# -------------------
@receiver(post_save, sender=Follow)
def new_follower(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.following,
            actor=instance.follower,
            notif_type="follow",
            target=instance.follower 
        )


# -------------------
# LIKE
# -------------------
@receiver(post_save, sender=Like)
def new_like(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.post.author,
            actor=instance.user,
            notif_type="like",
            target=instance.post
        )

# -------------------
# COMMENT
# -------------------
@receiver(post_save, sender=Comment)
def new_comment(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.post.author,
            actor=instance.user,  # <-- change from instance.author to instance.user
            notif_type="comment",
            target=instance
        )


# -------------------
# REPLY
# -------------------
@receiver(post_save, sender=Reply)
def new_reply(sender, instance, created, **kwargs):
    if not created:
        return

    # Case 1: Nested reply (replying to another reply)
    if instance.parent_reply:
        parent_user = instance.parent_reply.user
        if parent_user != instance.user:  # avoid self-notification
            create_notification(
                user=parent_user,
                actor=instance.user,
                notif_type="reply",
                target=instance
            )

    # Case 2: Replying directly to a comment
    else:
        comment_user = instance.comment.user
        if comment_user != instance.user:
            create_notification(
                user=comment_user,
                actor=instance.user,
                notif_type="reply",
                target=instance
            )



# -------------------
# NEW POST FOR FOLLOWERS
# -------------------
@receiver(post_save, sender=Post)
def notify_followers_new_post(sender, instance, created, **kwargs):
    if created:
        followers = [f.follower for f in instance.author.followers_rel.all()]
        for follower in followers:
            create_notification(
                user=follower,
                actor=instance.author,
                notif_type="post",
                target=instance
            )
