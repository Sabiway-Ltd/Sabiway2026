from cryptography.fernet import Fernet
from django.conf import settings
from django.core import checks


@checks.register(checks.Tags.security)
def verification_security_check(app_configs, **kwargs):
    if not getattr(settings, "VERIFICATION_GATE_ENABLED", True):
        return []
    key = getattr(settings, "VERIFICATION_DOCUMENT_KEY", "")
    if not key:
        level = checks.Warning if settings.DEBUG else checks.Error
        return [level(
            "VERIFICATION_DOCUMENT_KEY is not configured.",
            hint="Set a dedicated Fernet key before storing provider identity documents.",
            id="verification.E001" if not settings.DEBUG else "verification.W001",
        )]
    try:
        Fernet(key.encode("utf-8") if isinstance(key, str) else key)
    except Exception:
        return [checks.Error(
            "VERIFICATION_DOCUMENT_KEY is invalid.",
            hint="Generate a valid URL-safe base64 Fernet key and store it as an environment secret.",
            id="verification.E002",
        )]
    return []
