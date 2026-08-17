from rest_framework import mixins, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .analytics import measurement_snapshot, record_product_event
from .models import ProductEvent, SupportCase
from .serializers import SupportCaseSerializer, SupportCaseStaffUpdateSerializer
from .services import notify_support_case, record_operations_audit


class ProductEventIngestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        event_name = str(request.data.get("event_name", "")).strip().lower()
        source = str(request.data.get("source", "web")).strip().lower()
        if source not in {ProductEvent.Source.WEB, ProductEvent.Source.ANDROID, ProductEvent.Source.IOS}:
            return Response({"detail": "source must be web, android or ios"}, status=status.HTTP_400_BAD_REQUEST)
        event = record_product_event(
            event_name,
            actor=request.user,
            source=source,
            properties=request.data.get("properties") or {},
            anonymous_id=request.data.get("anonymous_id") or "",
        )
        if event is None:
            return Response({"detail": "Invalid event name."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"accepted": True}, status=status.HTTP_202_ACCEPTED)


class MeasurementSnapshotView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        if not (request.user.is_superuser or request.user.has_perm("operations.view_product_measurement") or request.user.has_perm("operations.view_operations_dashboard")):
            raise PermissionDenied("You do not have access to product measurement data.")
        try:
            hours = max(1, min(24 * 90, int(request.query_params.get("hours", 24))))
        except (TypeError, ValueError):
            hours = 24
        return Response(measurement_snapshot(hours=hours))


class SupportCaseViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = SupportCase.objects.select_related("opened_by", "assigned_to")
        if self.request.user.is_staff and self.request.user.has_perm("operations.manage_support"):
            status_filter = self.request.query_params.get("status", "").strip()
            priority_filter = self.request.query_params.get("priority", "").strip()
            if status_filter:
                qs = qs.filter(status=status_filter)
            if priority_filter:
                qs = qs.filter(priority=priority_filter)
            return qs
        return qs.filter(opened_by=self.request.user)

    def get_serializer_class(self):
        if self.action in {"update", "partial_update"}:
            return SupportCaseStaffUpdateSerializer
        return SupportCaseSerializer

    def perform_create(self, serializer):
        case = serializer.save(opened_by=self.request.user)
        record_operations_audit(
            actor=self.request.user,
            action="support_case_opened",
            target_type="support_case",
            target_id=case.id,
            new_state={"status": case.status, "category": case.category, "priority": case.priority},
        )

    def perform_update(self, serializer):
        if not (self.request.user.is_staff and self.request.user.has_perm("operations.manage_support")):
            raise PermissionDenied("Only authorised support staff can update support case handling fields.")
        case = self.get_object()
        previous = {"status": case.status, "priority": case.priority, "assigned_to": case.assigned_to_id}
        updated = serializer.save()
        record_operations_audit(
            actor=self.request.user,
            action="support_case_updated",
            target_type="support_case",
            target_id=updated.id,
            previous_state=previous,
            new_state={"status": updated.status, "priority": updated.priority, "assigned_to": updated.assigned_to_id},
        )
        if previous["status"] != updated.status:
            notify_support_case(updated, actor=self.request.user)
