import os

import requests
from django.conf import settings


def broadcast_marketplace_event(user_ids, event, payload):
    """Best-effort authenticated Django -> Socket.IO targeted broadcast.

    Database state remains authoritative; realtime failure never rolls back a
    successful marketplace mutation.
    """
    token = os.environ.get("INTERNAL_BROADCAST_TOKEN", "")
    headers = {"x-sabiway-internal-token": token} if token else {}
    try:
        response = requests.post(
            f"{settings.EXPRESS_URL}/broadcast-marketplace",
            json={"userIds": [str(user_id) for user_id in user_ids], "event": event, "payload": payload},
            headers=headers,
            timeout=2,
        )
        return response.ok
    except requests.RequestException:
        return False
