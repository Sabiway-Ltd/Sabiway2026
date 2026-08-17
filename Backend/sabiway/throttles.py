import hashlib

from rest_framework.throttling import SimpleRateThrottle


class SabiWayRateThrottle(SimpleRateThrottle):
    """One shared throttle that tightens sensitive anonymous endpoints.

    General authenticated traffic is keyed by user; anonymous traffic is keyed
    by client address. Authentication/reset routes additionally include a short
    hash of the submitted email where available so one person cannot cheaply
    brute-force a target while raw PII never appears in cache keys.
    """

    scope = "user"

    SENSITIVE_PATHS = (
        ("/auth/login/", "login"),
        ("/auth/signup/", "signup"),
        ("/auth/forgot-password/", "password_reset"),
        ("/auth/confirm-code/", "password_reset"),
        ("/auth/reset-password/", "password_reset"),
        ("/auth/google-login/", "oauth"),
        ("/auth/google/callback/", "oauth"),
        ("/auth/token/refresh/", "token_refresh"),
    )

    def _scope_for(self, request):
        path = request.path.lower()
        for suffix, scope in self.SENSITIVE_PATHS:
            if suffix in path:
                return scope
        return "user" if request.user and request.user.is_authenticated else "anon"

    def allow_request(self, request, view):
        self.scope = self._scope_for(request)
        self.rate = self.get_rate()
        if self.rate is None:
            return True
        self.num_requests, self.duration = self.parse_rate(self.rate)
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        if self.scope == "user" and request.user and request.user.is_authenticated:
            ident = f"user:{request.user.pk}"
        else:
            ident = self.get_ident(request)
            if self.scope in {"login", "signup", "password_reset", "oauth"}:
                email = str(getattr(request, "data", {}).get("email", "")).strip().lower()
                if email:
                    digest = hashlib.sha256(email.encode("utf-8")).hexdigest()[:16]
                    ident = f"{ident}:{digest}"
        if not ident:
            return None
        return self.cache_format % {"scope": self.scope, "ident": ident}
