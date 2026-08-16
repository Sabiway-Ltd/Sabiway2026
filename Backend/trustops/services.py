import hashlib
from datetime import timedelta
from decimal import Decimal

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction as db_transaction
from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from notifications.services import notify
from sabipay import gateway
from sabipay.models import Dispute, Transaction
from sabipay.services import amount_to_subunit, audit as sabipay_audit, release_transaction

from .models import (
    DisputeCase,
    DisputeEvidence,
    DisputeNote,
    FraudSignal,
    Review,
    ReviewReport,
    SupportAudit,
    SupportCase,
    SupportNote,
)

ALLOWED_EVIDENCE_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"}
MAX_EVIDENCE_SIZE = 10 * 1024 * 1024


def _evidence_fernet():
    key = getattr(settings, "TRUST_EVIDENCE_KEY", "")
    if not key:
        raise ImproperlyConfigured("TRUST_EVIDENCE_KEY must be configured before dispute evidence can be stored or read.")
    try:
        return Fernet(key.encode("utf-8") if isinstance(key, str) else key)
    except (TypeError, ValueError) as exc:
        raise ImproperlyConfigured("TRUST_EVIDENCE_KEY must be a valid Fernet key.") from exc


def store_dispute_evidence(dispute, uploader, upload):
    if not upload:
        return None
    content_type = getattr(upload, "content_type", "")
    if upload.size > MAX_EVIDENCE_SIZE:
        raise ValidationError({"evidence": "Evidence must be 10 MB or smaller."})
    if content_type not in ALLOWED_EVIDENCE_TYPES:
        raise ValidationError({"evidence": "Upload a JPG, PNG, WebP, PDF or text file."})
    raw = upload.read()
    return DisputeEvidence.objects.create(
        dispute=dispute,
        uploader=uploader,
        filename=(upload.name or "dispute-evidence")[:255],
        content_type=content_type or "application/octet-stream",
        size=len(raw),
        checksum_sha256=hashlib.sha256(raw).hexdigest(),
        encrypted_payload=_evidence_fernet().encrypt(raw),
    )


def decrypt_dispute_evidence(evidence):
    try:
        raw = _evidence_fernet().decrypt(bytes(evidence.encrypted_payload))
    except InvalidToken as exc:
        raise ValidationError("Dispute evidence could not be decrypted safely.") from exc
    if hashlib.sha256(raw).hexdigest() != evidence.checksum_sha256:
        raise ValidationError("Dispute evidence integrity check failed.")
    return raw


def _participant(tx, user):
    return user.id in {tx.client.user_id, tx.professional.user_id}


def _create_fraud_signals(dispute, opener_profile):
    tx = dispute.transaction
    high_value_threshold = Decimal(str(getattr(settings, "TRUST_HIGH_VALUE_NGN", "500000")))
    repeated_threshold = int(getattr(settings, "TRUST_REPEAT_DISPUTE_THRESHOLD", 3))
    if tx.currency == "NGN" and tx.amount >= high_value_threshold:
        FraudSignal.objects.create(
            profile=opener_profile,
            transaction=tx,
            dispute=dispute,
            code="high_value_dispute",
            severity=FraudSignal.Severity.HIGH,
            context={"amount": str(tx.amount), "currency": tx.currency, "threshold": str(high_value_threshold)},
        )
    recent_since = timezone.now() - timedelta(days=30)
    recent_count = Dispute.objects.filter(opened_by=opener_profile.user, created_at__gte=recent_since).count()
    if recent_count >= repeated_threshold:
        FraudSignal.objects.create(
            profile=opener_profile,
            transaction=tx,
            dispute=dispute,
            code="repeat_dispute_pattern",
            severity=FraudSignal.Severity.MEDIUM,
            context={"disputes_last_30_days": recent_count, "threshold": repeated_threshold},
        )


def open_dispute(*, tx, user, reason, details="", evidence=None):
    if not _participant(tx, user):
        raise PermissionDenied("Only a transaction participant can raise a dispute.")
    if tx.state != Transaction.State.DELIVERED:
        raise ValidationError("A dispute can only be raised after delivery and before SabiPay release.")
    if tx.release_eligible_at and timezone.now() > tx.release_eligible_at:
        raise ValidationError("The dispute window has ended because the SabiPay release period has expired.")
    if Dispute.objects.filter(transaction=tx, status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]).exists():
        raise ValidationError("An active dispute already exists for this transaction.")

    with db_transaction.atomic():
        dispute = Dispute.objects.create(transaction=tx, opened_by=user, reason=reason[:80], details=details)
        case = DisputeCase.objects.create(
            dispute=dispute,
            response_due_at=timezone.now() + timedelta(hours=int(getattr(settings, "TRUST_DISPUTE_RESPONSE_HOURS", 24))),
        )
        if evidence:
            store_dispute_evidence(dispute, user, evidence)
        old = tx.state
        tx.state = Transaction.State.DISPUTED
        tx.save(update_fields=["state", "updated_at"])
        sabipay_audit(tx, "dispute_opened", actor=user, source="trust", old=old, new=tx.state, reason=reason, metadata={"dispute_id": str(dispute.id)})
        _create_fraud_signals(dispute, user.profile)

    other = tx.professional if user.id == tx.client.user_id else tx.client
    notify(
        user=other,
        actor=user.profile,
        notif_type="dispute",
        target=dispute,
        message="A dispute was raised on this SabiPay transaction. Funds are frozen while it is reviewed.",
        deep_link="/trust?tab=disputes",
        event_key=f"dispute-opened:{dispute.id}:{other.user_id}",
        metadata={"dispute_id": str(dispute.id), "transaction_id": str(tx.id)},
        push=True,
        email=True,
    )
    return dispute, case


def start_dispute_review(case, actor):
    if not (actor.is_staff and (actor.is_superuser or actor.has_perm("trustops.manage_trust_cases"))):
        raise PermissionDenied("Trust reviewer permission is required.")
    dispute = case.dispute
    if dispute.status not in {Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW}:
        raise ValidationError("This dispute is not awaiting review.")
    dispute.status = Dispute.Status.UNDER_REVIEW
    dispute.save(update_fields=["status"])
    case.assigned_to = actor
    case.save(update_fields=["assigned_to", "updated_at"])
    sabipay_audit(dispute.transaction, "dispute_review_started", actor=actor, source="trust", metadata={"dispute_id": str(dispute.id)})
    return case


def add_dispute_note(dispute, actor, body, internal=True):
    if not (actor.is_staff and (actor.is_superuser or actor.has_perm("trustops.manage_trust_cases"))):
        raise PermissionDenied("Trust reviewer permission is required.")
    note = DisputeNote.objects.create(dispute=dispute, author=actor, body=body.strip(), internal=internal)
    sabipay_audit(dispute.transaction, "dispute_note_added", actor=actor, source="trust", metadata={"note_id": note.id, "internal": internal})
    return note


def _initiate_full_dispute_refund(tx, actor, reason):
    try:
        data = gateway.initiate_refund(
            transaction_reference=tx.funding_reference,
            amount_subunit=amount_to_subunit(tx.amount),
            reason=reason,
        )
    except gateway.PaystackError as exc:
        sabipay_audit(tx, "dispute_refund_initiation_failed", actor=actor, source="trust", reason=str(exc))
        raise ValidationError(str(exc)) from exc
    tx.refund_status = Transaction.RefundStatus.PENDING
    tx.refund_gateway_id = str(data.get("id") or "")
    tx.refund_reason = reason
    tx.save(update_fields=["refund_status", "refund_gateway_id", "refund_reason", "updated_at"])
    sabipay_audit(tx, "dispute_refund_initiated", actor=actor, source="trust", reason=reason, metadata={"gateway_refund_id": tx.refund_gateway_id})
    return data


def resolve_dispute(case, *, actor, decision, reason):
    if not (actor.is_staff and (actor.is_superuser or actor.has_perm("trustops.manage_trust_cases"))):
        raise PermissionDenied("Trust reviewer permission is required.")
    dispute = case.dispute
    tx = dispute.transaction
    if dispute.status not in {Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW} or tx.state != Transaction.State.DISPUTED:
        raise ValidationError("This dispute is no longer awaiting an outcome.")
    if decision == DisputeCase.Decision.PARTIAL:
        if not getattr(settings, "SABIPAY_PARTIAL_DISPUTE_POLICY_ENABLED", False):
            raise ValidationError("Partial dispute outcomes remain disabled until the product/payment policy is approved.")
        raise ValidationError("Partial outcome execution requires the approved settlement adapter before it can be enabled.")
    if decision not in {DisputeCase.Decision.RELEASE_FULL, DisputeCase.Decision.REFUND_FULL}:
        raise ValidationError("Choose an authorised dispute outcome.")

    with db_transaction.atomic():
        dispute.status = Dispute.Status.RESOLVED
        dispute.resolution = reason
        dispute.resolved_at = timezone.now()
        dispute.save(update_fields=["status", "resolution", "resolved_at"])
        case.decision = decision
        case.decision_reason = reason
        case.resolved_by = actor
        case.resolved_at = timezone.now()
        case.provider_release_amount = tx.provider_amount if decision == DisputeCase.Decision.RELEASE_FULL else Decimal("0.00")
        case.client_refund_amount = tx.amount if decision == DisputeCase.Decision.REFUND_FULL else Decimal("0.00")
        case.save()

        if decision == DisputeCase.Decision.RELEASE_FULL:
            tx.state = Transaction.State.DELIVERED
            tx.save(update_fields=["state", "updated_at"])
            release_transaction(tx, actor=actor, source="trust", force=True)
        else:
            _initiate_full_dispute_refund(tx, actor, reason)
        sabipay_audit(tx, "dispute_resolved", actor=actor, source="trust", reason=reason, metadata={"dispute_id": str(dispute.id), "decision": decision})

    for recipient in (tx.client, tx.professional):
        notify(
            user=recipient,
            notif_type="dispute",
            target=dispute,
            message=f"Your SabiPay dispute has been decided: {case.get_decision_display()}.",
            deep_link="/trust?tab=disputes",
            event_key=f"dispute-resolved:{dispute.id}:{recipient.user_id}",
            metadata={"decision": decision, "transaction_id": str(tx.id)},
            push=True,
            email=True,
        )
    return case


def refresh_professional_rating(professional):
    aggregate = Review.objects.filter(
        professional=professional,
        moderation_status=Review.ModerationStatus.PUBLISHED,
    ).aggregate(avg=Avg("rating"), count=Count("id"))
    average = aggregate["avg"] or 0
    professional.rating_average = Decimal(str(average)).quantize(Decimal("0.01"))
    professional.rating_count = aggregate["count"] or 0
    professional.save(update_fields=["rating_average", "rating_count", "updated_at"])
    return professional


def create_review(*, tx, user, rating, title="", body=""):
    if tx.client.user_id != user.id:
        raise PermissionDenied("Only the client can review this completed booking.")
    if tx.state != Transaction.State.RELEASED:
        raise ValidationError("A review is only available after a successfully completed and released booking.")
    if hasattr(tx, "review"):
        raise ValidationError("This booking already has a review.")
    if int(rating) < 1 or int(rating) > 5:
        raise ValidationError({"rating": "Rating must be between 1 and 5."})
    review = Review.objects.create(
        booking=tx.booking,
        transaction=tx,
        client=tx.client,
        professional=tx.professional,
        rating=int(rating),
        title=title.strip()[:120],
        body=body.strip(),
    )
    refresh_professional_rating(tx.professional)
    notify(
        user=tx.professional,
        actor=tx.client,
        notif_type="review",
        target=review,
        message=f"{tx.client.full_name} left a {review.rating}/5 review after a completed booking.",
        deep_link=f"/profile/{tx.professional.username}",
        event_key=f"review:{review.id}:{tx.professional.user_id}",
        email=False,
        push=True,
    )
    return review


def report_review(*, review, reporter, reason, details=""):
    if review.client_id == reporter.pk:
        raise ValidationError("You cannot report your own review.")
    report, created = ReviewReport.objects.get_or_create(
        review=review,
        reporter=reporter,
        defaults={"reason": reason[:80], "details": details},
    )
    if not created:
        raise ValidationError("You already reported this review.")
    if review.reports.filter(status=ReviewReport.Status.OPEN).count() >= int(getattr(settings, "TRUST_REVIEW_HIDE_REPORT_THRESHOLD", 3)):
        review.moderation_status = Review.ModerationStatus.HIDDEN
        review.moderation_reason = "Automatically hidden after repeated open reports pending moderator review."
        review.save(update_fields=["moderation_status", "moderation_reason", "updated_at"])
        refresh_professional_rating(review.professional)
    return report


def moderate_review(*, review, actor, action, reason=""):
    if not (actor.is_staff and (actor.is_superuser or actor.has_perm("trustops.moderate_reviews"))):
        raise PermissionDenied("Review moderation permission is required.")
    mapping = {
        "publish": Review.ModerationStatus.PUBLISHED,
        "hide": Review.ModerationStatus.HIDDEN,
        "remove": Review.ModerationStatus.REMOVED,
    }
    if action not in mapping:
        raise ValidationError("Choose publish, hide or remove.")
    review.moderation_status = mapping[action]
    review.moderation_reason = reason
    review.moderated_by = actor
    review.moderated_at = timezone.now()
    review.save()
    refresh_professional_rating(review.professional)
    review.reports.filter(status=ReviewReport.Status.OPEN).update(
        status=ReviewReport.Status.ACTIONED if action != "publish" else ReviewReport.Status.DISMISSED,
        reviewed_by=actor,
        reviewed_at=timezone.now(),
    )
    return review


def support_audit(case, event, actor=None, old="", new="", reason="", metadata=None):
    return SupportAudit.objects.create(case=case, actor=actor, event=event, from_status=old, to_status=new, reason=reason, metadata=metadata or {})


def open_support_case(*, profile, category, summary, details="", transaction=None, dispute=None, review=None):
    case = SupportCase.objects.create(
        opened_by=profile,
        category=category[:80],
        summary=summary[:180],
        details=details,
        transaction=transaction,
        dispute=dispute,
        review=review,
        response_due_at=timezone.now() + timedelta(hours=int(getattr(settings, "TRUST_SUPPORT_RESPONSE_HOURS", 24))),
    )
    support_audit(case, "case_opened", actor=profile.user, new=case.status)
    notify(user=profile, notif_type="support", target=case, message="Your SabiWay support case has been opened.", deep_link="/trust?tab=support", event_key=f"support-opened:{case.id}", email=True, push=True)
    return case


def add_support_note(case, *, actor, body, internal=False):
    is_staff = actor.is_staff and (actor.is_superuser or actor.has_perm("trustops.manage_support_cases"))
    if not is_staff and case.opened_by.user_id != actor.id:
        raise PermissionDenied("You cannot add a note to this support case.")
    if internal and not is_staff:
        raise PermissionDenied("Only support staff can add internal notes.")
    note = SupportNote.objects.create(case=case, author=actor, body=body.strip(), internal=internal)
    support_audit(case, "note_added", actor=actor, metadata={"note_id": note.id, "internal": internal})
    if is_staff and not internal:
        notify(user=case.opened_by, notif_type="support", target=case, message="SabiWay support added an update to your case.", deep_link="/trust?tab=support", event_key=f"support-note:{note.id}", email=True, push=True)
    return note


def escalate_support_case(case, *, actor, reason, priority=SupportCase.Priority.HIGH):
    if not (actor.is_staff and (actor.is_superuser or actor.has_perm("trustops.manage_support_cases"))):
        raise PermissionDenied("Support escalation permission is required.")
    old = case.status
    case.status = SupportCase.Status.ESCALATED
    case.priority = priority
    case.escalated_by = actor
    case.escalated_at = timezone.now()
    case.save()
    support_audit(case, "case_escalated", actor=actor, old=old, new=case.status, reason=reason)
    if priority == SupportCase.Priority.CRITICAL:
        FraudSignal.objects.create(
            profile=case.opened_by,
            transaction=case.transaction,
            dispute=case.dispute,
            support_case=case,
            code="critical_support_escalation",
            severity=FraudSignal.Severity.HIGH,
            context={"reason": reason},
        )
    notify(user=case.opened_by, notif_type="support", target=case, message="Your support case has been escalated for specialist review.", deep_link="/trust?tab=support", event_key=f"support-escalated:{case.id}:{case.escalated_at.isoformat()}", email=True, push=True)
    return case


def resolve_support_case(case, *, actor, reason):
    if not (actor.is_staff and (actor.is_superuser or actor.has_perm("trustops.manage_support_cases"))):
        raise PermissionDenied("Support case permission is required.")
    old = case.status
    case.status = SupportCase.Status.RESOLVED
    case.resolved_at = timezone.now()
    case.save(update_fields=["status", "resolved_at", "updated_at"])
    support_audit(case, "case_resolved", actor=actor, old=old, new=case.status, reason=reason)
    notify(user=case.opened_by, notif_type="support", target=case, message="Your SabiWay support case has been resolved.", deep_link="/trust?tab=support", event_key=f"support-resolved:{case.id}", email=True, push=True)
    return case
