import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("marketplace", "0002_seed_service_categories")]

    operations = [
        migrations.AddField(model_name="servicecategory", name="icon", field=models.CharField(blank=True, max_length=80)),
        migrations.AddField(model_name="servicecategory", name="sort_order", field=models.PositiveIntegerField(default=0)),
        migrations.AlterModelOptions(name="servicecategory", options={"ordering": ["sort_order", "name"]}),
        migrations.CreateModel(
            name="ServiceSubcategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(blank=True, max_length=140)),
                ("is_active", models.BooleanField(default=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="subcategories", to="marketplace.servicecategory")),
            ],
            options={"ordering": ["name"], "unique_together": {("category", "slug")}},
        ),
        migrations.AddField(model_name="servicelisting", name="subcategory", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="listings", to="marketplace.servicesubcategory")),
        migrations.AddField(model_name="servicelisting", name="country", field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name="servicelisting", name="city", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="servicelisting", name="pricing_note", field=models.CharField(blank=True, max_length=160)),
        migrations.AddField(model_name="servicelisting", name="availability_text", field=models.CharField(blank=True, max_length=160)),
        migrations.AddField(model_name="servicelisting", name="available_now", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="servicelisting", name="moderation_status", field=models.CharField(choices=[("draft", "Draft"), ("pending", "Pending review"), ("approved", "Approved"), ("rejected", "Rejected"), ("suspended", "Suspended")], default="pending", max_length=20)),
        migrations.AddField(model_name="servicelisting", name="is_featured", field=models.BooleanField(default=False)),
        migrations.RemoveIndex(model_name="servicelisting", name="mkt_list_cat_active_idx"),
        migrations.RemoveIndex(model_name="servicelisting", name="mkt_list_state_area_idx"),
        migrations.AddIndex(model_name="servicelisting", index=models.Index(fields=["category", "moderation_status", "is_active"], name="mkt_list_cat_mod_idx")),
        migrations.AddIndex(model_name="servicelisting", index=models.Index(fields=["country", "state", "city"], name="mkt_list_location_idx")),
        migrations.AlterModelOptions(name="servicelisting", options={"ordering": ["-is_featured", "-available_now", "-created_at"]}),
        migrations.CreateModel(
            name="JobPosting",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=180)),
                ("description", models.TextField()),
                ("budget_min", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("budget_max", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("currency", models.CharField(default="NGN", max_length=3)),
                ("delivery_mode", models.CharField(choices=[("in_person", "In person"), ("remote", "Remote"), ("both", "In person or remote")], default="in_person", max_length=20)),
                ("country", models.CharField(blank=True, max_length=100)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("city", models.CharField(blank=True, max_length=120)),
                ("area", models.CharField(blank=True, max_length=120)),
                ("needed_by", models.DateField(blank=True, null=True)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("open", "Open"), ("paused", "Paused"), ("closed", "Closed"), ("cancelled", "Cancelled")], default="open", max_length=20)),
                ("moderation_status", models.CharField(choices=[("pending", "Pending review"), ("approved", "Approved"), ("rejected", "Rejected"), ("suspended", "Suspended")], default="pending", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="jobs", to="marketplace.servicecategory")),
                ("client", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_jobs", to="profiles.profile")),
                ("subcategory", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="jobs", to="marketplace.servicesubcategory")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(model_name="jobposting", index=models.Index(fields=["status", "moderation_status"], name="mkt_job_status_mod_idx")),
        migrations.AddIndex(model_name="jobposting", index=models.Index(fields=["country", "state", "city"], name="mkt_job_location_idx")),
        migrations.AddIndex(model_name="jobposting", index=models.Index(fields=["category", "status"], name="mkt_job_category_idx")),
        migrations.CreateModel(
            name="JobResponse",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("message", models.TextField()),
                ("proposed_price", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("currency", models.CharField(default="NGN", max_length=3)),
                ("status", models.CharField(choices=[("sent", "Sent"), ("shortlisted", "Shortlisted"), ("declined", "Declined"), ("withdrawn", "Withdrawn")], default="sent", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("job", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="responses", to="marketplace.jobposting")),
                ("professional", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="job_responses", to="profiles.profile")),
            ],
            options={"ordering": ["-created_at"], "unique_together": {("job", "professional")}},
        ),
    ]
