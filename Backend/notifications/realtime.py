import os

import requests
from django.conf import settings

from operations.analytics import record_technical_metric


def _response_outcome(response):
    ok = bool(getattr(response, "ok", False))
    status_code = getattr(response, "status_code", None)
    status_code = status_code if isinstance(status_code, int) and not isinstance(status_code, bool) else None
    return ok, status_code


def broadcast_notification(user_id, notification):
    token = os.environ.get("INTERNAL_BROADCAST_TOKEN", "")
    headers = {"x-sabiway-internal-token": token} if token else {}
    try:
        response = requests.post(
            f"{settings.EXPRESS_URL}/broadcast-notification",
            json={"userId": str(user_id), "notification": notification},
            headers=headers,
            timeout=2,
        )
        ok, status_code = _response_outcome(response)
        try:
            record_technical_metric(
                "realtime_delivery",
                route="notification",
                success=ok,
                status_code=status_code,
                metadata={"source_feature": "notification"},
            )
        except Exception:
            pass
        return ok
    except requests.RequestException:
        try:
            record_technical_metric("realtime_delivery", route="notification", success=False, metadata={"source_feature": "notification"})
        except Exception:
            pass
        return False


def broadcast_unread_count(user_id, unread_count):
    return broadcast_notification(user_id, {"action": "update_unread_count", "unread_count": int(unread_count)})
