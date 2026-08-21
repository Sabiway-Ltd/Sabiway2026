from django.urls import path
from rest_framework.routers import DefaultRouter

from .booking_capabilities import BookingCapabilitiesView
from .views import (
    BookingRequestViewSet,
    JobPostingViewSet,
    JobResponseViewSet,
    MessageThreadViewSet,
    MessageViewSet,
    ScheduleProposalViewSet,
    ServiceCategoryViewSet,
    ServiceListingViewSet,
)

router = DefaultRouter()
router.register(r"categories", ServiceCategoryViewSet, basename="service-category")
router.register(r"listings", ServiceListingViewSet, basename="service-listing")
router.register(r"jobs", JobPostingViewSet, basename="job-posting")
router.register(r"job-responses", JobResponseViewSet, basename="job-response")
router.register(r"threads", MessageThreadViewSet, basename="message-thread")
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"bookings", BookingRequestViewSet, basename="booking-request")
router.register(r"schedule-proposals", ScheduleProposalViewSet, basename="schedule-proposal")

urlpatterns = [
    path("booking-capabilities/", BookingCapabilitiesView.as_view(), name="booking-capabilities"),
    *router.urls,
]
