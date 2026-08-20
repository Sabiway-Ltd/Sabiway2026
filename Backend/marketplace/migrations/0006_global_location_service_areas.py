import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("marketplace", "0005_phase5_messaging_booking")]

    operations = [
        migrations.AddField(model_name="servicelisting", name="country_code", field=models.CharField(blank=True, db_index=True, max_length=2)),
        migrations.AddField(model_name="servicelisting", name="postcode", field=models.CharField(blank=True, max_length=32)),
        migrations.AddField(model_name="servicelisting", name="latitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="servicelisting", name="longitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="servicelisting", name="service_radius_km", field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
        migrations.AddField(model_name="jobposting", name="country_code", field=models.CharField(blank=True, db_index=True, max_length=2)),
        migrations.AddField(model_name="jobposting", name="postcode", field=models.CharField(blank=True, max_length=32)),
        migrations.AddField(model_name="jobposting", name="latitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="jobposting", name="longitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="jobposting", name="search_radius_km", field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
        migrations.CreateModel(
            name="ServiceArea",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("country_code", models.CharField(db_index=True, max_length=2)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("city", models.CharField(blank=True, max_length=120)),
                ("area", models.CharField(blank=True, max_length=120)),
                ("postcode", models.CharField(blank=True, max_length=32)),
                ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("radius_km", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("listing", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="service_areas", to="marketplace.servicelisting")),
            ],
            options={"ordering": ["country_code", "state", "city", "area"]},
        ),
        migrations.AddIndex(model_name="servicelisting", index=models.Index(fields=["country_code", "state", "city"], name="mkt_list_cc_loc_idx")),
        migrations.AddIndex(model_name="jobposting", index=models.Index(fields=["country_code", "state", "city"], name="mkt_job_cc_loc_idx")),
        migrations.AddIndex(model_name="servicearea", index=models.Index(fields=["country_code", "state", "city"], name="mkt_area_location_idx")),
    ]
