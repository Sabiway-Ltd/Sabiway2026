from django.core.management.base import BaseCommand

from sabipay.models import Transaction
from sabipay.services import reconcile_transaction


class Command(BaseCommand):
    help = "Reconcile SabiPay funding state against Paystack with safe per-transaction retries."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=200)

    def handle(self, *args, **options):
        queryset = Transaction.objects.exclude(state__in=[Transaction.State.CANCELLED]).order_by("created_at")[: max(1, options["limit"])]
        matched = mismatch = pending = 0
        for tx in queryset:
            reconcile_transaction(tx)
            tx.refresh_from_db()
            if tx.reconciliation_status == Transaction.ReconciliationStatus.MATCHED:
                matched += 1
            elif tx.reconciliation_status == Transaction.ReconciliationStatus.MISMATCH:
                mismatch += 1
            else:
                pending += 1
        self.stdout.write(self.style.SUCCESS(f"SabiPay reconciliation: matched={matched}, mismatch={mismatch}, pending={pending}."))
