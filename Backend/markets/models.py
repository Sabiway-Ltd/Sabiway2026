import uuid

from django.db import models
from django.utils import timezone

from profiles.models import Profile


class UserLocationPreference(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="location_preference")
    country_code = models.CharField(max_length=2, blank=True, db_index=True)
    country_name = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=120, blank=True)
    area = models.CharField(max_length=120, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    use_for_default_search = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.profile.username} — {self.city or self.state or self.country_name}"


class ListingServiceArea(models.Model):
    listing = models.OneToOneField("marketplace.ServiceListing", on_delete=models.CASCADE, related_name="service_area")
    country_code = models.CharField(max_length=2, blank=True, db_index=True)
    country_name = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True, db_index=True)
    city = models.CharField(max_length=120, blank=True, db_index=True)
    area = models.CharField(max_length=120, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    service_radius_km = models.PositiveIntegerField(default=25)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["country_code", "state", "city"], name="markets_area_loc_idx")]

    def __str__(self):
        return f"{self.listing_id} — {self.city or self.state or self.country_name}"


class FxQuote(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        USED = "used", "Used"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requested_by = models.ForeignKey(Profile, on_delete=models.PROTECT, related_name="fx_quotes")
    booking = models.ForeignKey("marketplace.BookingRequest", on_delete=models.PROTECT, related_name="fx_quotes", null=True, blank=True)
    service_amount = models.DecimalField(max_digits=14, decimal_places=2)
    service_currency = models.CharField(max_length=3)
    payment_amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_currency = models.CharField(max_length=3)
    payout_amount = models.DecimalField(max_digits=14, decimal_places=2)
    payout_currency = models.CharField(max_length=3)
    fx_rate = models.DecimalField(max_digits=20, decimal_places=10)
    fx_fee = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    provider = models.CharField(max_length=64)
    provider_quote_id = models.CharField(max_length=120, blank=True)
    quoted_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(db_index=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["requested_by", "status", "expires_at"], name="markets_fx_user_idx")]

    @property
    def is_usable(self):
        return self.status == self.Status.ACTIVE and self.expires_at > timezone.now()


class CrossBorderPaymentContext(models.Model):
    transaction = models.OneToOneField("sabipay.Transaction", on_delete=models.CASCADE, related_name="cross_border_context")
    quote = models.OneToOneField(FxQuote, on_delete=models.PROTECT, related_name="payment_context")
    service_amount = models.DecimalField(max_digits=14, decimal_places=2)
    service_currency = models.CharField(max_length=3)
    payer_amount = models.DecimalField(max_digits=14, decimal_places=2)
    payer_currency = models.CharField(max_length=3)
    payout_amount = models.DecimalField(max_digits=14, decimal_places=2)
    payout_currency = models.CharField(max_length=3)
    fx_rate = models.DecimalField(max_digits=20, decimal_places=10)
    fx_provider = models.CharField(max_length=64)
    fx_fee = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    payment_processing_fee = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_id}: {self.payer_currency} → {self.payout_currency}"
