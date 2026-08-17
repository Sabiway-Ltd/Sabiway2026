import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("operations", "0001_initial"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="ProductEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("event_name", models.CharField(db_index=True, max_length=80)),
                ("source", models.CharField(choices=[("web","Web"),("android","Android"),("ios","iOS"),("backend","Backend")], db_index=True, default="backend", max_length=16)),
                ("anonymous_id_hash", models.CharField(blank=True, db_index=True, max_length=32)),
                ("properties", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="product_events", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering":["-created_at"],"permissions":[("view_product_measurement","Can view product measurement data")]},
        ),
        migrations.CreateModel(
            name="TechnicalMetric",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("metric", models.CharField(db_index=True, max_length=80)),
                ("route", models.CharField(blank=True, db_index=True, max_length=180)),
                ("status_code", models.PositiveSmallIntegerField(blank=True, db_index=True, null=True)),
                ("latency_ms", models.PositiveIntegerField(blank=True, null=True)),
                ("success", models.BooleanField(db_index=True, default=True)),
                ("source", models.CharField(db_index=True, default="backend", max_length=20)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="technical_metrics", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering":["-created_at"],"permissions":[("view_technical_measurement","Can view technical measurement data")]},
        ),
        migrations.AddIndex(model_name="productevent", index=models.Index(fields=["event_name","created_at"], name="ops_event_name_time_idx")),
        migrations.AddIndex(model_name="productevent", index=models.Index(fields=["source","created_at"], name="ops_event_source_idx")),
        migrations.AddIndex(model_name="technicalmetric", index=models.Index(fields=["metric","created_at"], name="ops_metric_name_time_idx")),
        migrations.AddIndex(model_name="technicalmetric", index=models.Index(fields=["success","created_at"], name="ops_metric_success_idx")),
    ]
