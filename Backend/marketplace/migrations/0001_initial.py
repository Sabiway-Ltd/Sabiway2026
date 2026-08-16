import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("profiles", "0004_profile_address"),
    ]

    operations = [
        migrations.CreateModel(
            name="ServiceCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("slug", models.SlugField(blank=True, max_length=140, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="ServiceListing",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=160)),
                ("description", models.TextField()),
                ("price_from", models.DecimalField(decimal_places=2, max_digits=12)),
                ("currency", models.CharField(default="NGN", max_length=3)),
                ("delivery_mode", models.CharField(choices=[("in_person", "In person"), ("remote", "Remote"), ("both", "In person or remote")], default="in_person", max_length=20)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("area", models.CharField(blank=True, max_length=120)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="listings", to="marketplace.servicecategory")),
                ("provider", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="service_listings", to="profiles.profile")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="BookingRequest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("requested_for", models.DateTimeField(blank=True, null=True)),
                ("message", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("accepted", "Accepted"), ("declined", "Declined"), ("cancelled", "Cancelled"), ("completed", "Completed")], default="pending", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("client", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="booking_requests", to="profiles.profile")),
                ("listing", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="booking_requests", to="marketplace.servicelisting")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(model_name="servicelisting", index=models.Index(fields=["category", "is_active"], name="marketplace__categor_84f1e5_idx")),
        migrations.AddIndex(model_name="servicelisting", index=models.Index(fields=["state", "area"], name="marketplace__state_93f56d_idx")),
        migrations.AddIndex(model_name="servicelisting", index=models.Index(fields=["provider", "is_active"], name="marketplace__provide_aa16fe_idx")),
        migrations.AddIndex(model_name="bookingrequest", index=models.Index(fields=["client", "status"], name="marketplace__client__f67f23_idx")),
        migrations.AddIndex(model_name="bookingrequest", index=models.Index(fields=["listing", "status"], name="marketplace__listing_3e41bd_idx")),
    ]
