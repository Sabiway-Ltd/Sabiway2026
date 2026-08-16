from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("posts", "0011_postreport"),
    ]

    operations = [
        migrations.AddField(
            model_name="post",
            name="is_hidden",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name="post",
            name="moderation_reason",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="postreport",
            name="status",
            field=models.CharField(
                choices=[("open", "Open"), ("dismissed", "Dismissed"), ("removed", "Removed"), ("restored", "Restored")],
                db_index=True,
                default="open",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="postreport",
            name="reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="postreport",
            name="resolution_note",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="postreport",
            name="reviewed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reviewed_post_reports",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name="ModerationAudit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(choices=[("reported", "Reported"), ("dismissed", "Dismissed"), ("removed", "Removed"), ("restored", "Restored")], max_length=20)),
                ("note", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="moderation_audit_events", to="posts.post")),
                ("report", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="audit_events", to="posts.postreport")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
