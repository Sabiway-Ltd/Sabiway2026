import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sabipay", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("profiles", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="payment_status",
            field=models.CharField(
                choices=[
                    ("not_started", "Not started"),
                    ("pending", "Pending"),
                    ("succeeded", "Succeeded"),
                    ("failed", "Failed"),
                    ("abandoned", "Abandoned"),
                    ("mismatch", "Mismatch"),
                ],
                default="not_started",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="last_payment_error",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="transaction",
            name="last_payment_checked_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(fields=["payment_status", "updated_at"], name="sabipay_payment_state_idx"),
        ),
        migrations.AddField(
            model_name="dispute",
            name="opened_by_profile",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="sabipay_disputes_opened", to="profiles.profile"),
        ),
        migrations.AddField(
            model_name="dispute",
            name="transaction_state_at_open",
            field=models.CharField(blank=True, max_length=24),
        ),
        migrations.AddField(
            model_name="dispute",
            name="outcome",
            field=models.CharField(
                choices=[
                    ("none", "No decision yet"),
                    ("resume", "Resume transaction"),
                    ("refund", "Refund client"),
                    ("release", "Release provider payment"),
                    ("closed_no_action", "Close with no financial action"),
                ],
                default="none",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="dispute",
            name="assigned_to",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sabipay_disputes_assigned", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="dispute",
            name="reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dispute",
            name="resolved_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sabipay_disputes_resolved", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="dispute",
            name="closed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="dispute",
            name="details",
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name="dispute",
            name="reason",
            field=models.CharField(
                choices=[
                    ("service_not_provided", "Service not provided"),
                    ("service_not_as_agreed", "Service not as agreed"),
                    ("payment_problem", "Payment problem"),
                    ("safety_concern", "Safety concern"),
                    ("duplicate_charge", "Duplicate charge"),
                    ("other", "Other"),
                ],
                default="other",
                max_length=80,
            ),
        ),
        migrations.CreateModel(
            name="DisputeEvidence",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("note", models.TextField()),
                ("reference_url", models.URLField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("dispute", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="evidence", to="sabipay.dispute")),
                ("submitted_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="sabipay_dispute_evidence", to="profiles.profile")),
            ],
            options={"ordering": ["created_at"]},
        ),
    ]
