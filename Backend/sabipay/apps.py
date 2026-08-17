from django.apps import AppConfig


class SabiPayConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "sabipay"
    verbose_name = "SabiPay"

    def ready(self):
        from . import checks  # noqa: F401
        from . import notifications  # noqa: F401
        from . import signals  # noqa: F401
