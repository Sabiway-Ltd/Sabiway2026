from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from operations.models import ProductEvent, TechnicalMetric


class Command(BaseCommand):
    help = "Delete expired product and technical measurement records according to SabiWay retention settings."

    def handle(self, *args, **options):
        now = timezone.now()
        event_days = int(getattr(settings, "PRODUCT_EVENT_RETENTION_DAYS", 180))
        metric_days = int(getattr(settings, "TECHNICAL_METRIC_RETENTION_DAYS", 30))
        events_deleted, _ = ProductEvent.objects.filter(created_at__lt=now - timedelta(days=event_days)).delete()
        metrics_deleted, _ = TechnicalMetric.objects.filter(created_at__lt=now - timedelta(days=metric_days)).delete()
        self.stdout.write(self.style.SUCCESS(f"Measurement retention cleanup: product_events={events_deleted}, technical_metrics={metrics_deleted}."))
