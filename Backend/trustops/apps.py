from django.apps import AppConfig


class TrustOpsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "trustops"
    verbose_name = "Trust & Safety Operations"

    def ready(self):
        from . import checks  # noqa: F401
