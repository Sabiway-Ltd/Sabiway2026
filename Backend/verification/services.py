import hashlib
from datetime import timedelta

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import VerificationAudit, VerificationDocument, VerificationSubmission

ALLOWED_DOCUMENT_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024


def verification_gate_enabled():
    return bool(getattr(settings, "VERIFICATION_GATE_ENABLED", True))


def is_professional_verified(profile):
    if not verification_gate_enabled():
        return profile.role == "professional"
    if profile.role != "professional":
        return False
    try:
        return profile.verification_submission.status == VerificationSubmission.Status.APPROVED
    except VerificationSubmission.DoesNotExist:
        return False


def _fernet():
    key = getattr(settings, "VERIFICATION_DOCUMENT_KEY", "")
    if not key:
        raise ImproperlyConfigured("VERIFICATION_DOCUMENT_KEY must be configured before verification documents can be stored or read.")
    try:
        return Fernet(key.encode("utf-8") if isinstance(key, str) else key)
    except (TypeError, ValueError) as exc:
        raise ImproperlyConfigured("VERIFICATION_DOCUMENT_KEY must be a valid Fernet key.") from exc


def review_sla_due(now=None):
    now = now or timezone.now()
    hours = int(getattr(settings, "VERIFICATION_REVIEW_SLA_HOURS", 48))
    return now + timedelta(hours=max(hours, 1))


def retention_until(now=None):
    now = now or timezone.now()
    days = int(getattr(settings, "VERIFICATION_RETENTION_DAYS", 365))
    return now + timedelta(days=max(days, 1))


def validate_document(upload):
    if not upload:
        raise ValidationError("A document is required.")
    if upload.size > MAX_DOCUMENT_SIZE:
        raise ValidationError("Verification documents must be 10 MB or smaller.")
    content_type = getattr(upload, "content_type", "")
    if content_type not in ALLOWED_DOCUMENT_TYPES:
        raise ValidationError("Upload a JPG, PNG, WebP or PDF document.")
    return upload


def store_document(submission, upload, kind):
    validate_document(upload)
    raw = upload.read()
    encrypted = _fernet().encrypt(raw)
    document = VerificationDocument.objects.create(
        submission=submission,
        submission_version=submission.version,
        kind=kind,
        filename=(upload.name or "verification-document")[:255],
        content_type=getattr(upload, "content_type", "application/octet-stream"),
        size=len(raw),
        checksum_sha256=hashlib.sha256(raw).hexdigest(),
        encrypted_payload=encrypted,
        retention_until=retention_until(),
    )
    VerificationAudit.objects.create(
        submission=submission,
        actor=submission.professional.user,
        event="document_added",
        from_status=submission.status,
        to_status=submission.status,
        metadata={"document_id": str(document.id), "kind": kind, "version": submission.version},
    )
    return document


def decrypt_document(document):
    if document.purged_at or not document.encrypted_payload:
        raise ValidationError("This verification document is no longer retained.")
    try:
        raw = _fernet().decrypt(bytes(document.encrypted_payload))
    except InvalidToken as exc:
        raise ValidationError("Verification document could not be decrypted safely.") from exc
    if hashlib.sha256(raw).hexdigest() != document.checksum_sha256:
        raise ValidationError("Verification document integrity check failed.")
    return raw


def audit(submission, event, actor=None, old="", new="", reason="", metadata=None):
    return VerificationAudit.objects.create(
        submission=submission,
        actor=actor,
        event=event,
        from_status=old,
        to_status=new,
        reason=reason,
        metadata=metadata or {},
    )


def submit_for_review(submission, actor=None, event="submitted"):
    old = submission.status
    now = timezone.now()
    submission.status = VerificationSubmission.Status.SUBMITTED
    submission.submitted_at = now
    submission.review_started_at = None
    submission.decision_at = None
    submission.reviewer = None
    submission.sla_due_at = review_sla_due(now)
    submission.decision_reason = ""
    submission.more_info_request = ""
    submission.save()
    audit(submission, event, actor=actor, old=old, new=submission.status, metadata={"version": submission.version})
    return submission


def demote_provider_listings(submission):
    from marketplace.models import ServiceListing

    if submission.status == VerificationSubmission.Status.APPROVED:
        return 0
    return ServiceListing.objects.filter(
        provider=submission.professional,
        moderation_status=ServiceListing.ModerationStatus.APPROVED,
    ).update(
        moderation_status=ServiceListing.ModerationStatus.PENDING,
        is_featured=False,
    )
