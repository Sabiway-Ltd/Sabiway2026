from rest_framework.routers import DefaultRouter

from .views import BookingRequestViewSet, ServiceCategoryViewSet, ServiceListingViewSet

router = DefaultRouter()
router.register(r"categories", ServiceCategoryViewSet, basename="service-category")
router.register(r"listings", ServiceListingViewSet, basename="service-listing")
router.register(r"bookings", BookingRequestViewSet, basename="booking-request")

urlpatterns = router.urls
