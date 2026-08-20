import django.db.models.deletion
import django.utils.timezone
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("profiles", "0004_profile_address"),
        ("marketplace", "0005_phase5_messaging_booking"),
        ("sabipay", "0002_phase8_payment_safety_disputes"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserLocationPreference",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("country_code", models.CharField(blank=True, db_index=True, max_length=2)),
                ("country_name", models.CharField(blank=True, max_length=100)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("city", models.CharField(blank=True, max_length=120)),
                ("area", models.CharField(blank=True, max_length=120)),
                ("postal_code", models.CharField(blank=True, max_length=32)),
                ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("use_for_default_search", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("profile", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="location_preference", to="profiles.profile")),
            ],
        ),
        migrations.CreateModel(
            name="ListingServiceArea",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("country_code", models.CharField(blank=True, db_index=True, max_length=2)),
                ("country_name", models.CharField(blank=True, max_length=100)),
                ("state", models.CharField(blank=True, db_index=True, max_length=100)),
                ("city", models.CharField(blank=True, db_index=True, max_length=120)),
                ("area", models.CharField(blank=True, max_length=120)),
                ("postal_code", models.CharField(blank=True, max_length=32)),
                ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("service_radius_km", models.PositiveIntegerField(default=25)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("listing", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="service_area", to="marketplace.servicelisting")),
            ],
            options={"indexes": [models.Index(fields=["country_code", "state", "city"], name="markets_area_loc_idx")]},
        ),
        migrations.CreateModel(
            name="FxQuote",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("service_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("service_currency", models.CharField(max_length=3)),
                ("payment_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("payment_currency", models.CharField(max_length=3)),
                ("payout_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("payout_currency", models.CharField(max_length=3)),
                ("fx_rate", models.DecimalField(decimal_places=10, max_digits=20)),
                ("fx_fee", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("provider", models.CharField(max_length=64)),
                ("provider_quote_id", models.CharField(blank=True, max_length=120)),
                ("quoted_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("expires_at", models.DateTimeField(db_index=True)),
                ("status", models.CharField(choices=[("active", "Active"), ("used", "Used"), ("expired", "Expired"), ("cancelled", "Cancelled")], db_index=True, default="active", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("booking", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="fx_quotes", to="marketplace.bookingrequest")),
                ("requested_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="fx_quotes", to="profiles.profile")),
            ],
            options={"ordering": ["-created_at"], "indexes": [models.Index(fields=["requested_by", "status", "expires_at"], name="markets_fx_user_idx")]},
        ),
        migrations.CreateModel(
            name="CrossBorderPaymentContext",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("service_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("service_currency", models.CharField(max_length=3)),
                ("payer_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("payer_currency", models.CharField(max_length=3)),
                ("payout_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("payout_currency", models.CharField(max_length=3)),
                ("fx_rate", models.DecimalField(decimal_places=10, max_digits=20)),
                ("fx_provider", models.CharField(max_length=64)),
                ("fx_fee", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("payment_processing_fee", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("quote", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="payment_context", to="markets.fxquote")),
                ("transaction", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="cross_border_context", to="sabipay.transaction")),
            ],
        ),
    ]
