from django.db import migrations


def sync_profile_roles(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")
    for profile in Profile.objects.select_related("user").iterator():
        user_role = getattr(profile.user, "role", None)
        if user_role and profile.role != user_role:
            Profile.objects.filter(pk=profile.pk).update(role=user_role)


class Migration(migrations.Migration):
    dependencies = [
        ("profiles", "0004_profile_address"),
    ]

    operations = [
        migrations.RunPython(sync_profile_roles, migrations.RunPython.noop),
    ]
