from django.contrib.contenttypes.models import ContentType

from notifications.models import Notification

from .models import OperationsAudit


def record_operations_audit(*, actor, action, target_type, target_id="", previous_state=None, new_state=None, metadata=None):
    return OperationsAudit.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id or ""),
        previous_state=previous_state or {},
        new_state=new_state or {},
        metadata=metadata or {},
    )


def notify_support_case(case, actor=None):
    if not case.opened_by_id:
        return None
    profile = getattr(case.opened_by, "profile", None)
    if not profile:
        return None
    actor_profile = getattr(actor, "profile", None) if actor else None
    return Notification.objects.create(
        user=profile,
        actor=actor_profile,
        type="support",
        message=f"Support case '{case.subject}' is now {case.get_status_display().lower()}.",
        target_content_type=ContentType.objects.get_for_model(case),
        target_object_id=str(case.id),
    )
