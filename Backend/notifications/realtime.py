import os

import requests
from django.conf import settings


def broadcast_notification(user_id, notification):
    """Best-effort authenticated Django -> Socket.IO notification broadcast.

    Persisted Django notification/read state remains authoritative. A realtime
    delivery failure must never roll back a successful database mutation.
    """
    token = os.environ.get("INTERNAL_BROADCAST_TOKEN", "")
    headers = {"x-sabiway-internal-token": token} if token else {}
    try:
        response = requests.post(
            f"{settings.EXPRESS_URL}/broadcast-notification",
            json={"userId": str(user_id), "notification": notification},
            headers=headers,
            timeout=2,
        )
        return response.ok
    except requests.RequestException:
        return False


def broadcast_unread_count(user_id, unread_count):
    return broadcast_notification(
        user_id,
        {
            "action": "update_unread_count",
            "unread_count": int(unread_count),
        },
    )
