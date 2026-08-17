import os

import requests
from django.conf import settings

from operations.analytics import record_technical_metric


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
        try:
            record_technical_metric("realtime_delivery", route="notification", success=response.ok, status_code=response.status_code, metadata={"source_feature":"notification"})
        except Exception:
            pass
        return response.ok
    except requests.RequestException:
        try:
            record_technical_metric("realtime_delivery", route="notification", success=False, metadata={"source_feature":"notification"})
        except Exception:
            pass
        return False


def broadcast_unread_count(user_id, unread_count):
    return broadcast_notification(user_id, {"action":"update_unread_count","unread_count":int(unread_count)})
