# profiles/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile, base_username_from_fullname, generate_initials

User = get_user_model()


@receiver(post_save, sender=User)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    if created:
        full_name = getattr(instance, 'full_name', None) or instance.email.split("@")[0]
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
            email=instance.email,
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