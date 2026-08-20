from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from marketplace.models import BookingRequest, JobPosting, JobResponse, ServiceListing

from .catalog import currency_for_country, normalise_country
from .models import ListingServiceArea


def _normalise_marketplace_instance(instance):
    code, name = normalise_country(instance.country)
    if name:
        instance.country = name
    suggested = currency_for_country(instance.country, requested=instance.currency)
    if suggested:
        instance.currency = suggested
    return code


@receiver(pre_save, sender=ServiceListing)
def normalise_service_listing(sender, instance, **kwargs):
    _normalise_marketplace_instance(instance)


@receiver(pre_save, sender=JobPosting)
def normalise_job_posting(sender, instance, **kwargs):
    _normalise_marketplace_instance(instance)


@receiver(pre_save, sender=JobResponse)
def normalise_job_response_currency(sender, instance, **kwargs):
    if instance.job_id:
        job = instance.job
        if job.currency:
            instance.currency = job.currency.upper()


@receiver(pre_save, sender=BookingRequest)
def normalise_booking_currency(sender, instance, **kwargs):
    if instance.listing_id and instance.listing.currency:
        instance.currency = instance.listing.currency.upper()
    elif instance.job_id and instance.job.currency:
        instance.currency = instance.job.currency.upper()


@receiver(post_save, sender=ServiceListing)
def sync_listing_service_area(sender, instance, **kwargs):
    code, name = normalise_country(instance.country)
    ListingServiceArea.objects.update_or_create(
        listing=instance,
        defaults={
            "country_code": code,
            "country_name": name or instance.country,
            "state": instance.state,
            "city": instance.city,
            "area": instance.area,
        },
    )
