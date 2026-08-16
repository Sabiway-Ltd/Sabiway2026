from django.conf import settings
from django.core.checks import Error, Tags, Warning, register


@register(Tags.security)
def sabipay_security_checks(app_configs, **kwargs):
    issues = []
    if getattr(settings, "SABIPAY_ENABLED", True) and not getattr(settings, "PAYSTACK_SECRET_KEY", ""):
        issues.append(Error(
            "SabiPay is enabled but PAYSTACK_SECRET_KEY is not configured.",
            hint="Use a Paystack test key outside production and a protected live key only after payment/security sign-off.",
            id="sabipay.E001",
        ))
    if getattr(settings, "SABIPAY_COMMISSION_RATE", 0.10) != 0.10:
        issues.append(Warning(
            "SABIPAY_COMMISSION_RATE differs from the approved Phase 7 rate of 10%.",
            id="sabipay.W001",
        ))
    if getattr(settings, "SABIPAY_FREEZE_DAYS", 7) != 7:
        issues.append(Warning(
            "SABIPAY_FREEZE_DAYS differs from the approved Phase 7 freeze period of 7 days.",
            id="sabipay.W002",
        ))
    return issues
