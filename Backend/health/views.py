from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()

            return Response({
                "status": "healthy",
                "database": "ok"
            })

        except Exception as e:
            return Response({
                "status": "unhealthy",
                "database": "error",
                "detail": str(e)
            }, status=500)
