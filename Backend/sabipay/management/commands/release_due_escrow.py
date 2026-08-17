from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework.exceptions import APIException

from operations.analytics import record_technical_metric
from sabipay.models import Dispute, Transaction
from sabipay.services import release_transaction


class Command(BaseCommand):
    help = "Release delivered SabiPay transactions whose 7-day freeze has elapsed, once and safely."

    def handle(self, *args, **options):
        released = blocked = 0
        try:
            due = Transaction.objects.filter(
                state=Transaction.State.DELIVERED,
                release_eligible_at__isnull=False,
                release_eligible_at__lte=timezone.now(),
            ).exclude(disputes__status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]).distinct()
            for tx in due.iterator():
                try:
                    release_transaction(tx, source="scheduler")
                    released += 1
                except APIException as exc:
                    blocked += 1
                    self.stderr.write(f"{tx.receipt_number}: {exc}")
            record_technical_metric("background_job", route="release_due_escrow", success=True, source="management", metadata={"source_feature":"sabipay_release"})
        except Exception:
            try:
                record_technical_metric("background_job", route="release_due_escrow", success=False, source="management", metadata={"source_feature":"sabipay_release"})
            except Exception:
                pass
            raise
        self.stdout.write(self.style.SUCCESS(f"SabiPay release run complete: {released} released, {blocked} blocked."))
