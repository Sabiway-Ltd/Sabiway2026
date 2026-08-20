from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("profiles", "0004_profile_address")]

    operations = [
        migrations.AddField(model_name="profile", name="country_code", field=models.CharField(blank=True, db_index=True, max_length=2)),
        migrations.AddField(model_name="profile", name="city", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="profile", name="postcode", field=models.CharField(blank=True, max_length=32)),
        migrations.AddField(model_name="profile", name="latitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="profile", name="longitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="profile", name="preferred_country_code", field=models.CharField(blank=True, db_index=True, max_length=2)),
        migrations.AddField(model_name="profile", name="preferred_state", field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name="profile", name="preferred_city", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="profile", name="preferred_area", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="profile", name="preferred_postcode", field=models.CharField(blank=True, max_length=32)),
        migrations.AddField(model_name="profile", name="preferred_latitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="profile", name="preferred_longitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddIndex(model_name="profile", index=models.Index(fields=["country_code", "state", "city"], name="profile_location_idx")),
        migrations.AddIndex(model_name="profile", index=models.Index(fields=["preferred_country_code", "preferred_city"], name="profile_pref_loc_idx")),
    ]
