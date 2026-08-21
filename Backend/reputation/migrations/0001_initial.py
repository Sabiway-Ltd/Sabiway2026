import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("marketplace", "0005_phase5_messaging_booking"),
        ("profiles", "0004_profile_address"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProfessionalReview",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ("comment", models.CharField(blank=True, max_length=1000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("booking", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="professional_review", to="marketplace.bookingrequest")),
                ("client", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="professional_reviews_written", to="profiles.profile")),
                ("professional", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="completed_work_reviews", to="profiles.profile")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="professionalreview",
            index=models.Index(fields=["professional", "created_at"], name="rep_prof_time_idx"),
        ),
        migrations.AddIndex(
            model_name="professionalreview",
            index=models.Index(fields=["professional", "rating"], name="rep_prof_rating_idx"),
        ),
    ]
