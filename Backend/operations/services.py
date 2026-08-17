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
