# profiles/signals.py
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile, Follow, base_username_from_fullname, generate_initials

User = get_user_model()

# -------------------
# Profile creation
# -------------------
@receiver(post_save, sender=User)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    if created:
        full_name = getattr(instance, "full_name", None) or instance.email.split("@")[0]
        initials = generate_initials(full_name)
        base = base_username_from_fullname(full_name)
        username = f"@{base}"
        counter = 0
        while Profile.objects.filter(username=username).exists():
            counter += 1
            username = f"@{base}_{counter}"

        Profile.objects.create(
            user=instance,
            full_name=full_name,
            initials=initials,
            username=username,
            profile_picture="",
            followers_count=0,
            following_count=0,
            posts_count=0,
            whatsapp_number="",
        )


@receiver(pre_save, sender=Profile)
def ensure_initials_on_profile_save(sender, instance, **kwargs):
    if instance.full_name:
        instance.initials = generate_initials(instance.full_name)
    if instance.username and not instance.username.startswith("@"):
        instance.username = "@" + instance.username


# -------------------
# Follow system
# -------------------
def update_follow_counts(follower: Profile, following: Profile):
    """Update followers/following counts"""
    follower.following_count = follower.following_rel.count()  # profiles this user is following
    follower.save(update_fields=["following_count"])
    following.followers_count = following.followers_rel.count()  # profiles following this user
    following.save(update_fields=["followers_count"])





@receiver(post_save, sender=Follow)
def handle_new_follow(sender, instance, created, **kwargs):
    """Update counts when someone follows"""
    if created:
        update_follow_counts(instance.follower, instance.following)


@receiver(post_delete, sender=Follow)
def handle_unfollow(sender, instance, **kwargs):
    """Update counts when someone unfollows"""
    update_follow_counts(instance.follower, instance.following)
