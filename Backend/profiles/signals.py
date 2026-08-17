# profiles/signals.py
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile, Follow, base_username_from_fullname, generate_initials

User = get_user_model()


@receiver(post_save, sender=User)
def create_or_sync_profile_for_user(sender, instance, created, **kwargs):
    """Create the profile once, then keep legacy mirrored role aligned to User.role.

    accounts.User.role is authoritative. Profile.role remains only as a
    compatibility mirror while older marketplace/profile code is migrated.
    """
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
            phone_number="",
            role=instance.role,
        )
        return

    profile = getattr(instance, "profile", None)
    if profile and profile.role != instance.role:
        Profile.objects.filter(pk=profile.pk).update(role=instance.role)


@receiver(pre_save, sender=Profile)
def ensure_profile_derived_fields(sender, instance, **kwargs):
    if instance.full_name:
        instance.initials = generate_initials(instance.full_name)
    if instance.username and not instance.username.startswith("@"):
        instance.username = "@" + instance.username

    # Never allow the compatibility mirror to become a second source of truth.
    if instance.user_id:
        account_role = User.objects.filter(pk=instance.user_id).values_list("role", flat=True).first()
        if account_role:
            instance.role = account_role


def update_follow_counts(follower: Profile, following: Profile):
    """Update followers/following counts."""
    follower.following_count = follower.following_rel.count()
    follower.save(update_fields=["following_count"])
    following.followers_count = following.followers_rel.count()
    following.save(update_fields=["followers_count"])


@receiver(post_save, sender=Follow)
def handle_new_follow(sender, instance, created, **kwargs):
    if created:
        update_follow_counts(instance.follower, instance.following)


@receiver(post_delete, sender=Follow)
def handle_unfollow(sender, instance, **kwargs):
    update_follow_counts(instance.follower, instance.following)
