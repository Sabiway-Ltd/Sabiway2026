import os

import requests
from django.conf import settings


def _headers():
    token = os.environ.get("INTERNAL_BROADCAST_TOKEN", "")
    return {"x-sabiway-internal-token": token} if token else {}


def broadcast_forum_event(payload):
    """Best-effort authenticated Django -> realtime broadcast.

    Database state remains authoritative. Realtime failure must not roll back
    a successful forum mutation.
    """
    try:
        requests.post(
            f"{settings.EXPRESS_URL}/broadcast",
            json=payload,
            headers=_headers(),
            timeout=2,
        )
        return True
    except requests.RequestException:
        return False
