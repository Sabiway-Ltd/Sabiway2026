from rest_framework.routers import DefaultRouter

from .views import ProfessionalReviewViewSet

router = DefaultRouter()
router.register(r"reviews", ProfessionalReviewViewSet, basename="professional-review")

urlpatterns = router.urls
