from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .hardening import database_ready


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        ready = database_ready()
        response = Response(
            {"status": "ready" if ready else "unavailable", "database": "ok" if ready else "unavailable"},
            status=status.HTTP_200_OK if ready else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
        response["Cache-Control"] = "no-store, max-age=0"
        return response
