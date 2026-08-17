import os
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

import requests
from django.conf import settings

from operations.analytics import record_technical_metric


def _json_safe(value):
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]
    if isinstance(value, (UUID, Decimal, date, datetime)):
        return str(value)
    return value


def _response_outcome(response):
    ok = bool(getattr(response, "ok", False))
    status_code = getattr(response, "status_code", None)
    status_code = status_code if isinstance(status_code, int) and not isinstance(status_code, bool) else None
    return ok, status_code


def broadcast_marketplace_event(user_ids, event, payload):
    token = os.environ.get("INTERNAL_BROADCAST_TOKEN", "")
    headers = {"x-sabiway-internal-token": token} if token else {}
    try:
        response = requests.post(
            f"{settings.EXPRESS_URL}/broadcast-marketplace",
            json={"userIds": [str(user_id) for user_id in user_ids], "event": event, "payload": _json_safe(payload)},
            headers=headers,
            timeout=2,
        )
        ok, status_code = _response_outcome(response)
        try:
            record_technical_metric(
                "realtime_delivery",
                route="marketplace",
                success=ok,
                status_code=status_code,
                metadata={"source_feature": event},
            )
        except Exception:
            pass
        return ok
    except (requests.RequestException, TypeError, ValueError):
        try:
            record_technical_metric("realtime_delivery", route="marketplace", success=False, metadata={"source_feature": event})
        except Exception:
            pass
        return False
