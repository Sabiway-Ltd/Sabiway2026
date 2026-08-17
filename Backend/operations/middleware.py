import re
import time

from .analytics import record_technical_metric

UUID_RE = re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F-]{27,36}\b")
NUMBER_RE = re.compile(r"/(?P<id>\d+)(?=/|$)")


def normalise_route(path):
    value = UUID_RE.sub(":id", path or "")
    value = NUMBER_RE.sub("/:id", value)
    return value[:180]


class ApiMeasurementMiddleware:
    """Best-effort request timing without exposing query strings or request bodies."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith("/api/") or request.path.startswith("/api/operations/events/"):
            return self.get_response(request)
        started = time.perf_counter()
        response = None
        try:
            response = self.get_response(request)
            return response
        finally:
            elapsed = max(0, round((time.perf_counter() - started) * 1000))
            status_code = getattr(response, "status_code", 500)
            try:
                record_technical_metric(
                    "api_request",
                    route=normalise_route(request.path),
                    status_code=status_code,
                    latency_ms=elapsed,
                    success=status_code < 500,
                    actor=getattr(request, "user", None),
                    metadata={"success": status_code < 500},
                )
            except Exception:
                # Observability must never become a platform outage.
                pass
