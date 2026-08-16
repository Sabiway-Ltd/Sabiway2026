from rest_framework.routers import DefaultRouter

from .views import (
    BookingRequestViewSet,
    JobPostingViewSet,
    JobResponseViewSet,
    ServiceCategoryViewSet,
    ServiceListingViewSet,
)

router = DefaultRouter()
router.register(r"categories", ServiceCategoryViewSet, basename="service-category")
router.register(r"listings", ServiceListingViewSet, basename="service-listing")
router.register(r"jobs", JobPostingViewSet, basename="job-posting")
router.register(r"job-responses", JobResponseViewSet, basename="job-response")
router.register(r"bookings", BookingRequestViewSet, basename="booking-request")

urlpatterns = router.urls
