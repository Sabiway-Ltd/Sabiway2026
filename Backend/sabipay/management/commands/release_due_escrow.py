from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework.exceptions import APIException

from sabipay.models import Dispute, Transaction
from sabipay.services import release_transaction


class Command(BaseCommand):
    help = "Release delivered SabiPay transactions whose 7-day freeze has elapsed, once and safely."

    def handle(self, *args, **options):
        due = Transaction.objects.filter(
            state=Transaction.State.DELIVERED,
            release_eligible_at__isnull=False,
            release_eligible_at__lte=timezone.now(),
        ).exclude(disputes__status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]).distinct()
        released = 0
        blocked = 0
        for tx in due.iterator():
            try:
                release_transaction(tx, source="scheduler")
                released += 1
            except APIException as exc:
                blocked += 1
                self.stderr.write(f"{tx.receipt_number}: {exc}")
        self.stdout.write(self.style.SUCCESS(f"SabiPay release run complete: {released} released, {blocked} blocked."))
