from django.db import migrations
from django.utils.text import slugify


SUBCATEGORIES = {
    "Electricians": ["Home Electrical Repairs", "Installation", "Generator & Power"],
    "Plumbing": ["Repairs", "Installation", "Drainage"],
    "Tailors": ["Native Wear", "Alterations", "Bridal & Occasion"],
    "Hair & Beauty": ["Hair Styling", "Barbering", "Makeup & Beauty"],
    "Tutors": ["Academic Tutoring", "Professional Skills", "Language Lessons"],
    "Event Services": ["Planning", "Decoration", "Event Support"],
    "Home Cleaning": ["Domestic Cleaning", "Deep Cleaning", "Office Cleaning"],
    "Tech Support": ["Device Support", "Software Support", "Networking"],
    "Photography": ["Events", "Portraits", "Commercial"],
    "Catering": ["Home Catering", "Events", "Meal Prep"],
}


def seed_phase4(apps, schema_editor):
    ServiceCategory = apps.get_model("marketplace", "ServiceCategory")
    ServiceSubcategory = apps.get_model("marketplace", "ServiceSubcategory")
    ServiceListing = apps.get_model("marketplace", "ServiceListing")

    # Preserve listings created before moderation was introduced.
    ServiceListing.objects.filter(moderation_status="pending").update(moderation_status="approved")

    for order, (category_name, names) in enumerate(SUBCATEGORIES.items(), start=1):
        category = ServiceCategory.objects.filter(name=category_name).first()
        if not category:
            continue
        category.sort_order = order
        category.save(update_fields=["sort_order"])
        for name in names:
            ServiceSubcategory.objects.get_or_create(
                category=category,
                slug=slugify(name),
                defaults={"name": name, "is_active": True},
            )


def reverse_seed(apps, schema_editor):
    ServiceSubcategory = apps.get_model("marketplace", "ServiceSubcategory")
    ServiceSubcategory.objects.filter(name__in=[name for values in SUBCATEGORIES.values() for name in values]).delete()


class Migration(migrations.Migration):
    dependencies = [("marketplace", "0003_phase4_jobs_discovery")]
    operations = [migrations.RunPython(seed_phase4, reverse_seed)]
