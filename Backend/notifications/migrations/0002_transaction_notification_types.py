from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0001_initial"),
        ("profiles", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="actor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="actor_notifications",
                to="profiles.profile",
            ),
        ),
        migrations.AlterField(
            model_name="notification",
            name="type",
            field=models.CharField(
                choices=[
                    ("follow", "Follow"),
                    ("like", "Like"),
                    ("comment", "Comment"),
                    ("reply", "Reply"),
                    ("post", "Post"),
                    ("message", "Message"),
                    ("booking", "Booking"),
                    ("schedule", "Schedule"),
                    ("verification", "Verification"),
                    ("payment", "Payment"),
                    ("dispute", "Dispute"),
                    ("review", "Review"),
                    ("support", "Support"),
                ],
                max_length=20,
            ),
        ),
    ]
