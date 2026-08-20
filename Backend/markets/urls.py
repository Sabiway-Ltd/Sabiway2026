from django.urls import path

from .views import FxQuoteView, LocationPreferenceView, MarketListView, NearbyServiceView

urlpatterns = [
    path("", MarketListView.as_view(), name="market-list"),
    path("location-preference/", LocationPreferenceView.as_view(), name="location-preference"),
    path("nearby-services/", NearbyServiceView.as_view(), name="nearby-services"),
    path("fx-quote/", FxQuoteView.as_view(), name="fx-quote"),
]
