from django.core.management.base import BaseCommand

from operations.analytics import record_technical_metric
from sabipay.models import Transaction
from sabipay.services import reconcile_transaction


class Command(BaseCommand):
    help = "Reconcile SabiPay funding state against Paystack with safe per-transaction retries."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=200)

    def handle(self, *args, **options):
        matched = mismatch = pending = 0
        try:
            queryset = Transaction.objects.exclude(state__in=[Transaction.State.CANCELLED]).order_by("created_at")[: max(1, options["limit"])]
            for tx in queryset:
                reconcile_transaction(tx)
                tx.refresh_from_db()
                if tx.reconciliation_status == Transaction.ReconciliationStatus.MATCHED:
                    matched += 1
                elif tx.reconciliation_status == Transaction.ReconciliationStatus.MISMATCH:
                    mismatch += 1
                else:
                    pending += 1
            record_technical_metric("background_job", route="reconcile_sabipay", success=True, source="management", metadata={"source_feature":"sabipay_reconciliation"})
        except Exception:
            try: record_technical_metric("background_job", route="reconcile_sabipay", success=False, source="management", metadata={"source_feature":"sabipay_reconciliation"})
            except Exception: pass
            raise
        self.stdout.write(self.style.SUCCESS(f"SabiPay reconciliation: matched={matched}, mismatch={mismatch}, pending={pending}."))
