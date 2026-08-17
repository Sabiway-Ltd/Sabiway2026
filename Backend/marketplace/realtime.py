import os
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

import requests
from django.conf import settings

from operations.analytics import record_technical_metric


def _json_safe(value):
    if isinstance(value, dict): return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)): return [_json_safe(item) for item in value]
    if isinstance(value, (UUID, Decimal, date, datetime)): return str(value)
    return value


def broadcast_marketplace_event(user_ids, event, payload):
    token = os.environ.get("INTERNAL_BROADCAST_TOKEN", "")
    headers = {"x-sabiway-internal-token": token} if token else {}
    try:
        response = requests.post(
            f"{settings.EXPRESS_URL}/broadcast-marketplace",
            json={"userIds":[str(user_id) for user_id in user_ids],"event":event,"payload":_json_safe(payload)},
            headers=headers,
            timeout=2,
        )
        record_technical_metric("realtime_delivery", route="marketplace", success=response.ok, status_code=response.status_code, metadata={"source_feature": event})
        return response.ok
    except (requests.RequestException, TypeError, ValueError):
        try: record_technical_metric("realtime_delivery", route="marketplace", success=False, metadata={"source_feature": event})
        except Exception: pass
        return False
