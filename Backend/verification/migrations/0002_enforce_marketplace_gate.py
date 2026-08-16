from django.db import migrations


def demote_unverified_listings(apps, schema_editor):
    ServiceListing = apps.get_model("marketplace", "ServiceListing")
    ServiceListing.objects.filter(moderation_status="approved").update(moderation_status="pending", is_featured=False)


class Migration(migrations.Migration):
    dependencies = [
        ("verification", "0001_initial"),
        ("marketplace", "0005_phase5_messaging_booking"),
    ]

    operations = [migrations.RunPython(demote_unverified_listings, migrations.RunPython.noop)]
