import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("profiles", "0004_profile_address"),
    ]

    operations = [
        migrations.CreateModel(
            name="VerificationSubmission",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("status", models.CharField(choices=[("submitted", "Submitted"), ("in_review", "In review"), ("approved", "Approved"), ("rejected", "Rejected"), ("more_info", "More information needed")], default="submitted", max_length=24)),
                ("identity_type", models.CharField(choices=[("passport", "Passport"), ("national_id", "National ID"), ("drivers_licence", "Driver's licence"), ("other", "Other government-issued ID")], max_length=32)),
                ("credential_summary", models.TextField(blank=True)),
                ("address_line", models.CharField(blank=True, max_length=255)),
                ("city", models.CharField(blank=True, max_length=120)),
                ("state", models.CharField(blank=True, max_length=120)),
                ("country", models.CharField(blank=True, max_length=120)),
                ("version", models.PositiveIntegerField(default=1)),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("review_started_at", models.DateTimeField(blank=True, null=True)),
                ("decision_at", models.DateTimeField(blank=True, null=True)),
                ("sla_due_at", models.DateTimeField(blank=True, null=True)),
                ("decision_reason", models.TextField(blank=True)),
                ("more_info_request", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("professional", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="verification_submission", to="profiles.profile")),
                ("reviewer", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="verification_reviews", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-submitted_at", "-created_at"],
                "permissions": [("review_verification", "Can review provider verification submissions")],
            },
        ),
        migrations.CreateModel(
            name="VerificationDocument",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("submission_version", models.PositiveIntegerField(default=1)),
                ("kind", models.CharField(choices=[("identity", "Government ID"), ("credential", "Skill or experience evidence"), ("address", "Address evidence")], max_length=24)),
                ("filename", models.CharField(max_length=255)),
                ("content_type", models.CharField(max_length=100)),
                ("size", models.PositiveIntegerField()),
                ("checksum_sha256", models.CharField(max_length=64)),
                ("encrypted_payload", models.BinaryField(editable=False)),
                ("retention_until", models.DateTimeField(blank=True, null=True)),
                ("purged_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("submission", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="documents", to="verification.verificationsubmission")),
            ],
            options={"ordering": ["kind", "-created_at"]},
        ),
        migrations.CreateModel(
            name="VerificationAudit",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("event", models.CharField(max_length=60)),
                ("from_status", models.CharField(blank=True, max_length=24)),
                ("to_status", models.CharField(blank=True, max_length=24)),
                ("reason", models.TextField(blank=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="verification_audit_events", to=settings.AUTH_USER_MODEL)),
                ("submission", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="audit_events", to="verification.verificationsubmission")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(model_name="verificationsubmission", index=models.Index(fields=["status", "sla_due_at"], name="verify_status_sla_idx")),
        migrations.AddIndex(model_name="verificationsubmission", index=models.Index(fields=["professional", "status"], name="verify_prof_status_idx")),
        migrations.AddIndex(model_name="verificationdocument", index=models.Index(fields=["retention_until", "purged_at"], name="verify_retention_idx")),
        migrations.AddIndex(model_name="verificationaudit", index=models.Index(fields=["submission", "created_at"], name="verify_audit_time_idx")),
    ]
