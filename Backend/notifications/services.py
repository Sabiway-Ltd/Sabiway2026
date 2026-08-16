import os
from typing import Optional

import requests
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.mail import send_mail
from django.db import IntegrityError
from django.utils import timezone

from profiles.models import Profile

from .models import Notification, NotificationDelivery, NotificationPreference, PushDevice
from .serializers import NotificationSerializer


def _realtime_headers():
    token = os.environ.get("INTERNAL_BROADCAST_TOKEN", "")
    return {"x-sabiway-internal-token": token} if token else {}


def _broadcast_in_app(notification):
    if not getattr(settings, "NOTIFICATION_REALTIME_DELIVERY_ENABLED", True):
        return
    try:
        requests.post(
            f"{settings.EXPRESS_URL}/broadcast-notification",
            json={"userId": str(notification.user.user_id), "notification": NotificationSerializer(notification).data},
            headers=_realtime_headers(),
            timeout=2,
        )
    except requests.RequestException:
        pass


def _skip(delivery, reason):
    delivery.status = NotificationDelivery.Status.SKIPPED
    delivery.error = reason
    delivery.attempted_at = timezone.now()
    delivery.save(update_fields=["status", "error", "attempted_at"])


def _send_push(notification, delivery, preference):
    if not getattr(settings, "NOTIFICATION_PUSH_DELIVERY_ENABLED", True):
        return _skip(delivery, "Push delivery is disabled operationally.")
    if not preference.push_enabled:
        return _skip(delivery, "Push disabled by user preference.")
    tokens = list(PushDevice.objects.filter(profile=notification.user, is_active=True).values_list("token", flat=True))
    if not tokens:
        return _skip(delivery, "No active push device.")
    endpoint = getattr(settings, "EXPO_PUSH_ENDPOINT", "https://exp.host/--/api/v2/push/send")
    payload = [{"to": token, "title": "SabiWay", "body": notification.message or "You have a new SabiWay update.", "data": {"deep_link": notification.deep_link, "notification_id": notification.id}, "sound": "default"} for token in tokens]
    try:
        response = requests.post(endpoint, json=payload, timeout=getattr(settings, "NOTIFICATION_DELIVERY_TIMEOUT_SECONDS", 6))
        response.raise_for_status()
        delivery.status = NotificationDelivery.Status.SENT
        delivery.provider_reference = f"expo:{len(tokens)}"
        delivery.sent_at = timezone.now()
        delivery.error = ""
    except requests.RequestException as exc:
        delivery.status = NotificationDelivery.Status.FAILED
        delivery.error = str(exc)[:1000]
    delivery.attempted_at = timezone.now()
    delivery.save(update_fields=["status", "provider_reference", "sent_at", "error", "attempted_at"])


def _send_email(notification, delivery, preference):
    if not getattr(settings, "NOTIFICATION_EMAIL_DELIVERY_ENABLED", False):
        return _skip(delivery, "Email delivery is disabled operationally.")
    if not preference.email_enabled:
        return _skip(delivery, "Email disabled by user preference.")
    if notification.type == "payment" and not preference.payment_email_enabled:
        return _skip(delivery, "Payment emails disabled by user preference.")
    if notification.type == "dispute" and not preference.dispute_email_enabled:
        return _skip(delivery, "Dispute emails disabled by user preference.")
    if not notification.user.user.email:
        return _skip(delivery, "No email address available.")
    try:
        send_mail(
            subject=f"SabiWay — {notification.type.replace('_', ' ').title()} update",
            message=(notification.message or "You have a new SabiWay update.") + (f"\n\nOpen: {notification.deep_link}" if notification.deep_link else ""),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[notification.user.user.email],
            fail_silently=False,
        )
        delivery.status = NotificationDelivery.Status.SENT
        delivery.sent_at = timezone.now()
        delivery.error = ""
    except Exception as exc:
        delivery.status = NotificationDelivery.Status.FAILED
        delivery.error = str(exc)[:1000]
    delivery.attempted_at = timezone.now()
    delivery.save(update_fields=["status", "sent_at", "error", "attempted_at"])


def notify(*, user: Profile, notif_type: str, message: str, actor: Optional[Profile] = None, target=None, deep_link: str = "", metadata=None, event_key: Optional[str] = None, push: bool = True, email: bool = True):
    if not user:
        return None
    if actor and actor.pk == user.pk:
        return None
    target_ct = ContentType.objects.get_for_model(target) if target else None
    target_id = str(target.pk) if target else None
    try:
        notification = Notification.objects.create(
            user=user, actor=actor, type=notif_type, target_content_type=target_ct,
            target_object_id=target_id, message=message, deep_link=deep_link,
            metadata=metadata or {}, event_key=event_key,
        )
    except IntegrityError:
        if event_key:
            return Notification.objects.filter(event_key=event_key).first()
        raise
    NotificationDelivery.objects.create(notification=notification, channel=NotificationDelivery.Channel.IN_APP, status=NotificationDelivery.Status.SENT, attempted_at=timezone.now(), sent_at=timezone.now())
    _broadcast_in_app(notification)
    preference, _ = NotificationPreference.objects.get_or_create(profile=user)
    if push:
        delivery = NotificationDelivery.objects.create(notification=notification, channel=NotificationDelivery.Channel.PUSH)
        _send_push(notification, delivery, preference)
    if email:
        delivery = NotificationDelivery.objects.create(notification=notification, channel=NotificationDelivery.Channel.EMAIL)
        _send_email(notification, delivery, preference)
    return notification


def retry_failed_delivery(delivery):
    preference, _ = NotificationPreference.objects.get_or_create(profile=delivery.notification.user)
    if delivery.channel == NotificationDelivery.Channel.PUSH:
        _send_push(delivery.notification, delivery, preference)
    elif delivery.channel == NotificationDelivery.Channel.EMAIL:
        _send_email(delivery.notification, delivery, preference)
    return delivery
