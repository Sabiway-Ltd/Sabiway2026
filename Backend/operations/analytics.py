import hashlib
import re
from datetime import timedelta
from django.db.models import Avg, Count, Q
from django.utils import timezone
from .models import ProductEvent, TechnicalMetric

SAFE_EVENT_NAME = re.compile(r"^[a-z][a-z0-9_]{1,79}$")
SAFE_PROPERTY_KEYS = {"route","screen","role","category","status","result_count","query_length","delivery_mode","payment_status","booking_status","verification_status","notification_type","error_code","network","app_version","platform_version","source_feature","success","reason_code"}

def _clean_properties(properties):
    if not isinstance(properties, dict): return {}
    clean = {}
    for key, value in properties.items():
        if key not in SAFE_PROPERTY_KEYS: continue
        if isinstance(value, (bool, int, float)) or value is None: clean[key] = value
        elif isinstance(value, str): clean[key] = value[:160]
    return clean

def hash_anonymous_id(value):
    return hashlib.sha256(str(value).encode()).hexdigest()[:32] if value else ""

def record_product_event(event_name, *, actor=None, source="backend", properties=None, anonymous_id=""):
    if not SAFE_EVENT_NAME.match(event_name or ""): return None
    source = source if source in ProductEvent.Source.values else ProductEvent.Source.BACKEND
    return ProductEvent.objects.create(event_name=event_name, actor=actor if getattr(actor,"is_authenticated",False) else None, source=source, anonymous_id_hash=hash_anonymous_id(anonymous_id), properties=_clean_properties(properties or {}))

def record_technical_metric(metric, *, route="", status_code=None, latency_ms=None, success=True, actor=None, source="backend", metadata=None):
    return TechnicalMetric.objects.create(metric=metric[:80], route=(route or "")[:180], status_code=status_code, latency_ms=latency_ms, success=bool(success), actor=actor if getattr(actor,"is_authenticated",False) else None, source=source[:20], metadata=_clean_properties(metadata or {}))

def measurement_snapshot(*, hours=24):
    since = timezone.now() - timedelta(hours=hours)
    events = ProductEvent.objects.filter(created_at__gte=since)
    metrics = TechnicalMetric.objects.filter(created_at__gte=since)
    api = metrics.filter(metric="api_request")
    api_count = api.count(); api_errors = api.filter(Q(status_code__gte=500)|Q(success=False)).count()
    latency = api.aggregate(avg=Avg("latency_ms"))["avg"] or 0
    counts = {row["event_name"]: row["total"] for row in events.values("event_name").annotate(total=Count("id"))}
    return {"window_hours":hours,"product_events":events.count(),"active_users":events.exclude(actor=None).values("actor_id").distinct().count(),"registration_completed":counts.get("registration_completed",0),"onboarding_completed":counts.get("onboarding_completed",0),"profile_completed":counts.get("profile_completed",0),"verification_started":counts.get("verification_started",0),"verification_completed":counts.get("verification_completed",0),"search_performed":counts.get("search_performed",0),"post_created":counts.get("post_created",0),"message_sent":counts.get("message_sent",0),"transaction_started":counts.get("transaction_started",0),"transaction_completed":counts.get("transaction_completed",0),"api_requests":api_count,"api_5xx_or_failures":api_errors,"api_error_rate":round(api_errors/api_count,4) if api_count else 0,"api_avg_latency_ms":round(float(latency),2),"login_failures":metrics.filter(metric="login_failure",success=False).count(),"realtime_failures":metrics.filter(metric="realtime_delivery",success=False).count(),"payment_failures":metrics.filter(metric="payment_provider",success=False).count(),"push_failures":metrics.filter(metric="push_delivery",success=False).count(),"database_failures":metrics.filter(metric="database",success=False).count()}
