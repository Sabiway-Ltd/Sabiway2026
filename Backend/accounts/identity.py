import re

from rest_framework import serializers


NIGERIAN_MOBILE_PREFIXES = {
    "070", "071", "080", "081", "090", "091",
}


def normalise_phone_number(value: str | None) -> str:
    """Return a canonical E.164-style Nigerian mobile number.

    Phone is optional. Nigerian local mobile formats such as 080..., 081... and
    090... are normalised to +234.... International +234/234 forms are also
    accepted. Other country formats are rejected until SabiWay explicitly adds
    international phone support rather than guessing their numbering rules.
    """
    if value is None:
        return ""

    raw = str(value).strip()
    if not raw:
        return ""

    compact = re.sub(r"[\s().-]", "", raw)
    if compact.startswith("+"):
        digits = compact[1:]
    else:
        digits = compact

    if not digits.isdigit():
        raise serializers.ValidationError("Enter a valid Nigerian mobile number.")

    if digits.startswith("234"):
        national = "0" + digits[3:]
    elif digits.startswith("0"):
        national = digits
    else:
        raise serializers.ValidationError("Use a Nigerian number beginning 0 or +234.")

    if len(national) != 11 or national[:3] not in NIGERIAN_MOBILE_PREFIXES:
        raise serializers.ValidationError("Enter a valid 11-digit Nigerian mobile number.")

    return "+234" + national[1:]
