# profiles/signals.py
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile, Follow, base_username_from_fullname, generate_initials

User = get_user_model()


@receiver(post_save, sender=User)
def create_or_sync_profile_for_user(sender, instance, created, **kwargs):
    """Create a profile once, then keep compatibility mirrors aligned.

    accounts.User owns account identity and role. Profile.full_name and
    Profile.role remain compatibility mirrors while older surfaces are migrated.
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
    if profile:
        updates = {}
        if profile.role != instance.role:
            updates["role"] = instance.role
        if profile.full_name != instance.full_name:
            updates["full_name"] = instance.full_name
            updates["initials"] = generate_initials(instance.full_name)
        if updates:
            Profile.objects.filter(pk=profile.pk).update(**updates)


@receiver(pre_save, sender=Profile)
def ensure_profile_derived_fields(sender, instance, **kwargs):
    if instance.user_id:
        account = User.objects.filter(pk=instance.user_id).values("role", "full_name").first()
        if account:
            instance.role = account["role"]
            instance.full_name = account["full_name"]

    if instance.full_name:
        instance.initials = generate_initials(instance.full_name)
    if instance.username and not instance.username.startswith("@"):
        instance.username = "@" + instance.username


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
