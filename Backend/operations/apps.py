from django.apps import AppConfig


class OperationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "operations"
    verbose_name = "SabiWay Operations"

    def ready(self):
        from django.contrib import admin
        from django.db.models.signals import post_migrate

        from .dashboard import install_operations_dashboard
        from .roles import sync_operational_roles

        post_migrate.connect(
            lambda **kwargs: sync_operational_roles(),
            sender=self,
            dispatch_uid="operations.sync_operational_roles",
        )
        install_operations_dashboard(admin.site)
