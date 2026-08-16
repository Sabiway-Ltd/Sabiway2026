from django.db import migrations
from django.utils.text import slugify


CATEGORIES = [
    ("Electricians", "Electrical installation, maintenance and repairs"),
    ("Plumbing", "Plumbing installation, maintenance and repairs"),
    ("Tailors", "Tailoring, alterations and fashion services"),
    ("Hair & Beauty", "Hair, grooming and beauty services"),
    ("Tutors", "Academic, professional and skills tutoring"),
    ("Event Services", "Event planning, decoration and support services"),
    ("Home Cleaning", "Domestic and commercial cleaning services"),
    ("Tech Support", "Device, software and digital support services"),
    ("Photography", "Photography and visual production services"),
    ("Catering", "Food preparation and catering services"),
]


def seed_categories(apps, schema_editor):
    ServiceCategory = apps.get_model("marketplace", "ServiceCategory")
    for name, description in CATEGORIES:
        ServiceCategory.objects.get_or_create(
            name=name,
            defaults={"slug": slugify(name), "description": description},
        )


def unseed_categories(apps, schema_editor):
    ServiceCategory = apps.get_model("marketplace", "ServiceCategory")
    ServiceCategory.objects.filter(name__in=[name for name, _ in CATEGORIES]).delete()


class Migration(migrations.Migration):
    dependencies = [("marketplace", "0001_initial")]
    operations = [migrations.RunPython(seed_categories, unseed_categories)]
