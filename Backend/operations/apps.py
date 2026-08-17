from django.apps import AppConfig


def _sync_roles_after_migrate(**kwargs):
    from .roles import sync_operational_roles

    sync_operational_roles()


class OperationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "operations"
    verbose_name = "SabiWay Operations"

    def ready(self):
        from django.contrib import admin
        from django.db.models.signals import post_migrate

        from . import signals  # noqa: F401
        from .dashboard import install_operations_dashboard

        post_migrate.connect(
            _sync_roles_after_migrate,
            sender=self,
            dispatch_uid="operations.sync_operational_roles",
            weak=False,
        )
        install_operations_dashboard(admin.site)
