import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(name="OperationsAudit", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("action", models.CharField(db_index=True, max_length=100)),
            ("target_type", models.CharField(db_index=True, max_length=80)),
            ("target_id", models.CharField(blank=True, max_length=120)),
            ("previous_state", models.JSONField(blank=True, default=dict)),
            ("new_state", models.JSONField(blank=True, default=dict)),
            ("metadata", models.JSONField(blank=True, default=dict)),
            ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="operations_audit_events", to=settings.AUTH_USER_MODEL)),
        ], options={"ordering":["-created_at"],"permissions":[("view_operations_dashboard","Can view the SabiWay operations dashboard"),("manage_operational_roles","Can manage operational role assignments")]}),
        migrations.CreateModel(name="PlatformConfiguration", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("key", models.CharField(max_length=120, unique=True)),
            ("value", models.JSONField(blank=True, default=dict)),
            ("description", models.TextField(blank=True)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="platform_configuration_updates", to=settings.AUTH_USER_MODEL)),
        ], options={"ordering":["key"],"permissions":[("manage_platform_config","Can manage non-secret platform configuration")]}),
        migrations.CreateModel(name="SupportCase", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("category", models.CharField(choices=[("account","Account"),("safety","Safety"),("marketplace","Marketplace"),("payment","Payment"),("verification","Verification"),("content","Content"),("technical","Technical"),("other","Other")], default="other", max_length=24)),
            ("subject", models.CharField(max_length=180)),
            ("description", models.TextField()),
            ("status", models.CharField(choices=[("open","Open"),("in_progress","In progress"),("waiting_user","Waiting for user"),("resolved","Resolved"),("closed","Closed")], db_index=True, default="open", max_length=24)),
            ("priority", models.CharField(choices=[("low","Low"),("normal","Normal"),("high","High"),("urgent","Urgent")], db_index=True, default="normal", max_length=16)),
            ("reference_type", models.CharField(blank=True, max_length=40)),
            ("reference_id", models.CharField(blank=True, max_length=120)),
            ("internal_note", models.TextField(blank=True)),
            ("resolved_at", models.DateTimeField(blank=True, null=True)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("assigned_to", models.ForeignKey(blank=True, limit_choices_to={"is_staff":True}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assigned_support_cases", to=settings.AUTH_USER_MODEL)),
            ("opened_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="support_cases", to=settings.AUTH_USER_MODEL)),
        ], options={"ordering":["-created_at"],"permissions":[("manage_support","Can manage support cases")]}),
        migrations.AddIndex(model_name="operationsaudit", index=models.Index(fields=["target_type","target_id","created_at"], name="ops_audit_target_idx")),
        migrations.AddIndex(model_name="supportcase", index=models.Index(fields=["status","priority","created_at"], name="ops_support_queue_idx")),
        migrations.AddIndex(model_name="supportcase", index=models.Index(fields=["opened_by","created_at"], name="ops_support_user_idx")),
    ]
