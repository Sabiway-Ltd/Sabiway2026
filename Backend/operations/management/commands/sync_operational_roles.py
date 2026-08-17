from django.core.management.base import BaseCommand

from operations.roles import sync_operational_roles


class Command(BaseCommand):
    help = "Create/update SabiWay least-privilege operational role groups."

    def handle(self, *args, **options):
        synced = sync_operational_roles()
        for name, count in synced.items():
            self.stdout.write(f"{name}: {count} permission(s)")
        self.stdout.write(self.style.SUCCESS("Operational roles synchronised."))
