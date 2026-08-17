from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BankListView, DisputeViewSet, PaystackWebhookView, PayoutDestinationViewSet, TransactionViewSet

router = DefaultRouter()
router.register("transactions", TransactionViewSet, basename="sabipay-transaction")
router.register("disputes", DisputeViewSet, basename="sabipay-dispute")
router.register("payout-destinations", PayoutDestinationViewSet, basename="sabipay-payout-destination")

urlpatterns = [
    path("", include(router.urls)),
    path("banks/", BankListView.as_view(), name="sabipay-banks"),
    path("webhooks/paystack/", PaystackWebhookView.as_view(), name="sabipay-paystack-webhook"),
]
