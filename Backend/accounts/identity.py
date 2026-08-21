import re

from rest_framework import serializers


NIGERIAN_MOBILE_PREFIXES = {
    "070", "071", "080", "081", "090", "091",
}


def normalise_phone_number(value: str | None) -> str:
    """Return a canonical mobile number for SabiWay's supported launch markets.

    Phone is optional. Nigerian local mobile formats such as 080... and +234...
    are normalised to +234. UK mobile formats such as 07... and +44 7... are
    normalised to +44. Other country formats remain rejected until their
    numbering rules are explicitly supported rather than guessed.
    """
    if value is None:
        return ""

    raw = str(value).strip()
    if not raw:
        return ""

    compact = re.sub(r"[\s().-]", "", raw)
    digits = compact[1:] if compact.startswith("+") else compact
    if not digits.isdigit():
        raise serializers.ValidationError("Enter a valid Nigeria or UK mobile number.")

    if digits.startswith("234"):
        national = "0" + digits[3:]
        if len(national) == 11 and national[:3] in NIGERIAN_MOBILE_PREFIXES:
            return "+234" + national[1:]
        raise serializers.ValidationError("Enter a valid Nigerian mobile number.")

    if digits.startswith("44"):
        national = "0" + digits[2:]
        if len(national) == 11 and national.startswith("07"):
            return "+44" + national[1:]
        raise serializers.ValidationError("Enter a valid UK mobile number.")

    if digits.startswith("0"):
        if len(digits) == 11 and digits[:3] in NIGERIAN_MOBILE_PREFIXES:
            return "+234" + digits[1:]
        if len(digits) == 11 and digits.startswith("07"):
            return "+44" + digits[1:]
        raise serializers.ValidationError("Enter a valid Nigeria or UK mobile number.")

    raise serializers.ValidationError("Use a mobile number beginning 0, +234 or +44.")
