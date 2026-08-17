import hashlib
import re
from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.utils import timezone

from .models import ProductEvent, TechnicalMetric

SAFE_EVENT_NAME = re.compile(r"^[a-z][a-z0-9_]{1,79}$")
SAFE_PROPERTY_KEYS = {
    "route", "screen", "role", "category", "status", "result_count", "query_length",
    "delivery_mode", "payment_status", "booking_status", "verification_status",
    "notification_type", "error_code", "network", "app_version", "platform_version",
    "source_feature", "success", "reason_code",
}


def _clean_properties(properties):
    if not isinstance(properties, dict):
        return {}
    clean = {}
    for key, value in properties.items():
        if key not in SAFE_PROPERTY_KEYS:
            continue
        if isinstance(value, (bool, int, float)) or value is None:
            clean[key] = value
        elif isinstance(value, str):
            clean[key] = value[:160]
    return clean


def hash_anonymous_id(value):
    return hashlib.sha256(str(value).encode()).hexdigest()[:32] if value else ""


def record_product_event(event_name, *, actor=None, source="backend", properties=None, anonymous_id=""):
    if not SAFE_EVENT_NAME.match(event_name or ""):
        return None
    source = source if source in ProductEvent.Source.values else ProductEvent.Source.BACKEND
    return ProductEvent.objects.create(
        event_name=event_name,
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        source=source,
        anonymous_id_hash=hash_anonymous_id(anonymous_id),
        properties=_clean_properties(properties or {}),
    )


def _safe_optional_int(value):
    if isinstance(value, bool):
        return None
    return value if isinstance(value, int) else None


def _safe_optional_number(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return max(0, int(value))
    return None


def record_technical_metric(metric, *, route="", status_code=None, latency_ms=None, success=True, actor=None, source="backend", metadata=None):
    """Persist bounded technical telemetry without trusting external response objects."""
    return TechnicalMetric.objects.create(
        metric=str(metric or "unknown")[:80],
        route=str(route or "")[:180],
        status_code=_safe_optional_int(status_code),
        latency_ms=_safe_optional_number(latency_ms),
        success=bool(success) if isinstance(success, (bool, int)) else True,
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        source=str(source or "backend")[:20],
        metadata=_clean_properties(metadata or {}),
    )


def _ratio(numerator, denominator):
    return round(numerator / denominator, 4) if denominator else 0


def measurement_snapshot(*, hours=24):
    now = timezone.now()
    since = now - timedelta(hours=hours)
    events = ProductEvent.objects.filter(created_at__gte=since)
    metrics = TechnicalMetric.objects.filter(created_at__gte=since)
    api = metrics.filter(metric="api_request")
    api_count = api.count()
    api_errors = api.filter(Q(status_code__gte=500) | Q(success=False)).count()
    latency = api.aggregate(avg=Avg("latency_ms"))["avg"] or 0
    counts = {row["event_name"]: row["total"] for row in events.values("event_name").annotate(total=Count("id"))}

    registration_started = counts.get("registration_started", 0)
    registration_completed = counts.get("registration_completed", 0)
    transaction_started = counts.get("transaction_started", 0)
    transaction_completed = counts.get("transaction_completed", 0)
    verification_started = counts.get("verification_started", 0)
    verification_completed = counts.get("verification_completed", 0)

    current_7d = set(ProductEvent.objects.filter(created_at__gte=now - timedelta(days=7), actor__isnull=False).values_list("actor_id", flat=True))
    previous_7d = set(ProductEvent.objects.filter(created_at__gte=now - timedelta(days=14), created_at__lt=now - timedelta(days=7), actor__isnull=False).values_list("actor_id", flat=True))
    retained_7d = len(current_7d & previous_7d)

    realtime = metrics.filter(metric="realtime_delivery")
    payment = metrics.filter(metric="payment_provider")
    background = metrics.filter(metric="background_job")
    login_failures = api.filter(route__icontains="/auth/login/", status_code__gte=400, status_code__lt=500).count()
    source_counts = {row["source"]: row["total"] for row in events.values("source").annotate(total=Count("id"))}

    return {
        "window_hours": hours,
        "product_events": events.count(),
        "active_users": events.exclude(actor=None).values("actor_id").distinct().count(),
        "active_users_7d": len(current_7d),
        "retained_users_7d": retained_7d,
        "retention_7d": _ratio(retained_7d, len(previous_7d)),
        "registration_started": registration_started,
        "registration_completed": registration_completed,
        "registration_conversion": _ratio(registration_completed, registration_started),
        "onboarding_completed": counts.get("onboarding_completed", 0),
        "profile_completed": counts.get("profile_completed", 0),
        "verification_started": verification_started,
        "verification_completed": verification_completed,
        "verification_conversion": _ratio(verification_completed, verification_started),
        "search_performed": counts.get("search_performed", 0),
        "post_created": counts.get("post_created", 0),
        "engagement_events": counts.get("engagement_created", 0),
        "message_sent": counts.get("message_sent", 0),
        "transaction_started": transaction_started,
        "transaction_completed": transaction_completed,
        "transaction_conversion": _ratio(transaction_completed, transaction_started),
        "screen_viewed": counts.get("screen_viewed", 0),
        "events_web": source_counts.get(ProductEvent.Source.WEB, 0),
        "events_android": source_counts.get(ProductEvent.Source.ANDROID, 0),
        "events_ios": source_counts.get(ProductEvent.Source.IOS, 0),
        "events_backend": source_counts.get(ProductEvent.Source.BACKEND, 0),
        "api_requests": api_count,
        "api_5xx_or_failures": api_errors,
        "api_error_rate": _ratio(api_errors, api_count),
        "api_avg_latency_ms": round(float(latency), 2),
        "login_failures": login_failures,
        "realtime_deliveries": realtime.count(),
        "realtime_failures": realtime.filter(success=False).count(),
        "realtime_failure_rate": _ratio(realtime.filter(success=False).count(), realtime.count()),
        "payment_provider_requests": payment.count(),
        "payment_failures": payment.filter(success=False).count(),
        "payment_failure_rate": _ratio(payment.filter(success=False).count(), payment.count()),
        "background_jobs": background.count(),
        "background_job_failures": background.filter(success=False).count(),
        "push_failures": metrics.filter(metric="push_delivery", success=False).count(),
        "database_failures": metrics.filter(metric="database", success=False).count(),
    }
