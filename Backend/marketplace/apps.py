from django.apps import AppConfig


class MarketplaceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "marketplace"

    def ready(self):
        # Keep transaction lifecycle side effects close to marketplace state changes.
        # Import here so signal registration happens once Django has loaded apps.
        from . import transaction_notifications  # noqa: F401
