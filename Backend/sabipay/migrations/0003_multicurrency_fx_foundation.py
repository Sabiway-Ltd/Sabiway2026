import uuid
from decimal import Decimal

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("sabipay", "0002_phase8_payment_safety_disputes")]

    operations = [
        migrations.AddField(model_name="transaction", name="service_amount", field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
        migrations.AddField(model_name="transaction", name="service_currency", field=models.CharField(blank=True, max_length=3)),
        migrations.AddField(model_name="transaction", name="payer_amount", field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
        migrations.AddField(model_name="transaction", name="payer_currency", field=models.CharField(blank=True, max_length=3)),
        migrations.AddField(model_name="transaction", name="payout_amount", field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
        migrations.AddField(model_name="transaction", name="payout_currency", field=models.CharField(blank=True, max_length=3)),
        migrations.AddField(model_name="transaction", name="payment_market", field=models.CharField(blank=True, db_index=True, max_length=2)),
        migrations.AddField(model_name="transaction", name="payout_market", field=models.CharField(blank=True, db_index=True, max_length=2)),
        migrations.AddField(model_name="transaction", name="fx_rate", field=models.DecimalField(blank=True, decimal_places=10, max_digits=24, null=True)),
        migrations.AddField(model_name="transaction", name="fx_provider", field=models.CharField(blank=True, max_length=80)),
        migrations.AddField(model_name="transaction", name="fx_quote_reference", field=models.CharField(blank=True, db_index=True, max_length=120)),
        migrations.AddField(model_name="transaction", name="fx_quoted_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="transaction", name="fx_expires_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="transaction", name="fx_fee", field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
        migrations.AddField(model_name="transaction", name="payment_processing_fee", field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
        migrations.AddField(model_name="payoutdestination", name="country_code", field=models.CharField(blank=True, db_index=True, max_length=2)),
        migrations.AddField(model_name="payoutdestination", name="currency", field=models.CharField(default="NGN", max_length=3)),
        migrations.CreateModel(
            name="FxQuote",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("provider", models.CharField(max_length=80)),
                ("reference", models.CharField(max_length=120, unique=True)),
                ("source_currency", models.CharField(max_length=3)),
                ("target_currency", models.CharField(max_length=3)),
                ("source_amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("target_amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("rate", models.DecimalField(decimal_places=10, max_digits=24)),
                ("fee_amount", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                ("quoted_at", models.DateTimeField()),
                ("expires_at", models.DateTimeField()),
                ("status", models.CharField(choices=[("active", "Active"), ("used", "Used"), ("expired", "Expired"), ("cancelled", "Cancelled")], default="active", max_length=16)),
                ("raw_reference", models.CharField(blank=True, max_length=240)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("transaction", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="fx_quotes", to="sabipay.transaction")),
            ],
            options={"ordering": ["-quoted_at"]},
        ),
        migrations.AddIndex(model_name="transaction", index=models.Index(fields=["service_currency", "payer_currency", "payout_currency"], name="sabipay_currency_idx")),
        migrations.AddIndex(model_name="fxquote", index=models.Index(fields=["source_currency", "target_currency", "status"], name="sabipay_fx_pair_idx")),
        migrations.RunSQL(
            "UPDATE sabipay_transaction SET service_amount = amount, service_currency = currency, payer_amount = amount, payer_currency = currency, payout_amount = provider_amount, payout_currency = currency WHERE service_amount IS NULL;",
            migrations.RunSQL.noop,
        ),
    ]
