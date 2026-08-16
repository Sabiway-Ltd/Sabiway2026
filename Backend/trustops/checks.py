from django.conf import settings
from django.core.checks import Error, Tags, Warning, register


@register(Tags.security)
def trust_security_checks(app_configs, **kwargs):
    issues = []
    if not getattr(settings, "TRUST_EVIDENCE_KEY", ""):
        issues.append(Error(
            "TRUST_EVIDENCE_KEY is not configured.",
            hint="Generate a dedicated Fernet key and store it in the backend secret store before dispute evidence is accepted.",
            id="trustops.E001",
        ))
    if getattr(settings, "SABIPAY_PARTIAL_DISPUTE_POLICY_ENABLED", False):
        issues.append(Warning(
            "Partial dispute outcomes are enabled but require an approved settlement policy/adapter before production use.",
            id="trustops.W001",
        ))
    return issues
