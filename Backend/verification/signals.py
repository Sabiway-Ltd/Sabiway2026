from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from rest_framework.exceptions import PermissionDenied

from marketplace.models import BookingRequest, JobResponse, ServiceListing

from .models import VerificationSubmission
from .services import demote_provider_listings, is_professional_verified


@receiver(pre_save, sender=ServiceListing)
def block_unverified_listing_publication(sender, instance, **kwargs):
    if instance.moderation_status == ServiceListing.ModerationStatus.APPROVED and not is_professional_verified(instance.provider):
        raise PermissionDenied("Provider verification approval is required before a service can go live.")


@receiver(pre_save, sender=JobResponse)
def block_unverified_job_response(sender, instance, **kwargs):
    if instance._state.adding and not is_professional_verified(instance.professional):
        raise PermissionDenied("Provider verification approval is required before responding to jobs.")


@receiver(pre_save, sender=BookingRequest)
def block_unverified_booking(sender, instance, **kwargs):
    professional = instance.professional or (instance.listing.provider if instance.listing_id else None)
    if not professional:
        return
    if instance._state.adding and not is_professional_verified(professional):
        raise PermissionDenied("Provider verification approval is required before receiving bookings.")
    if not instance._state.adding and instance.status == BookingRequest.Status.ACCEPTED:
        old = BookingRequest.objects.filter(pk=instance.pk).values_list("status", flat=True).first()
        if old != BookingRequest.Status.ACCEPTED and not is_professional_verified(professional):
            raise PermissionDenied("Provider verification approval is required before accepting bookings.")


@receiver(post_save, sender=VerificationSubmission)
def enforce_verification_visibility(sender, instance, **kwargs):
    demote_provider_listings(instance)
