from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("profiles", "0004_profile_address")]

    operations = [
        migrations.AddField(model_name="profile", name="rating_average", field=models.DecimalField(decimal_places=2, default=0, max_digits=3)),
        migrations.AddField(model_name="profile", name="rating_count", field=models.PositiveIntegerField(default=0)),
    ]
