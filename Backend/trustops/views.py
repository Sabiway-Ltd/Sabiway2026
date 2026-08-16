from django.http import HttpResponse
from django.db.models import Q
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from sabipay.models import Dispute

from .models import DisputeCase, DisputeEvidence, FraudSignal, Review, SupportCase
from .permissions import IsFraudReviewer, IsReviewModerator, IsSupportOperator, IsTrustReviewer
from .serializers import (
    DisputeCaseSerializer,
    DisputeCreateSerializer,
    DisputeDecisionSerializer,
    DisputeNoteCreateSerializer,
    FraudSignalSerializer,
    ReviewCreateSerializer,
    ReviewModerationSerializer,
    ReviewReportCreateSerializer,
    ReviewSerializer,
    SupportCaseCreateSerializer,
    SupportCaseSerializer,
    SupportEscalateSerializer,
    SupportNoteCreateSerializer,
    SupportResolveSerializer,
)
from .services import (
    add_dispute_note,
    add_support_note,
    create_review,
    decrypt_dispute_evidence,
    escalate_support_case,
    moderate_review,
    open_dispute,
    open_support_case,
    report_review,
    resolve_dispute,
    resolve_support_case,
    start_dispute_review,
)


class DisputeCaseViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "trust_dispute"

    def get_queryset(self):
        user = self.request.user
        qs = DisputeCase.objects.select_related(
            "dispute__transaction__client__user",
            "dispute__transaction__professional__user",
            "dispute__opened_by",
            "assigned_to",
            "resolved_by",
        ).prefetch_related("dispute__evidence_items", "dispute__case_notes")
        if user.is_staff and (user.is_superuser or user.has_perm("trustops.manage_trust_cases")):
            status_filter = self.request.query_params.get("status", "").strip()
            priority = self.request.query_params.get("priority", "").strip()
            if status_filter:
                qs = qs.filter(dispute__status=status_filter)
            if priority:
                qs = qs.filter(priority=priority)
            return qs
        profile = user.profile
        return qs.filter(Q(dispute__transaction__client=profile) | Q(dispute__transaction__professional=profile)).distinct()

    def get_serializer_class(self):
        return DisputeCreateSerializer if self.action == "create" else DisputeCaseSerializer

    def create(self, request, *args, **kwargs):
        serializer = DisputeCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        dispute, case = open_dispute(
            tx=values["transaction"],
            user=request.user,
            reason=values["reason"],
            details=values.get("details", ""),
            evidence=values.get("evidence"),
        )
        return Response(DisputeCaseSerializer(case, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="start-review", permission_classes=[permissions.IsAuthenticated, IsTrustReviewer])
    def start_review(self, request, pk=None):
        case = start_dispute_review(self.get_object(), request.user)
        return Response(DisputeCaseSerializer(case, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsTrustReviewer])
    def decision(self, request, pk=None):
        serializer = DisputeDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        case = resolve_dispute(
            self.get_object(),
            actor=request.user,
            decision=serializer.validated_data["decision"],
            reason=serializer.validated_data["reason"],
        )
        return Response(DisputeCaseSerializer(case, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsTrustReviewer])
    def note(self, request, pk=None):
        serializer = DisputeNoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        case = self.get_object()
        note = add_dispute_note(case.dispute, request.user, serializer.validated_data["body"], serializer.validated_data["internal"])
        return Response({"id": note.id, "created_at": note.created_at}, status=status.HTTP_201_CREATED)


class DisputeEvidenceViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DisputeEvidence.objects.select_related("dispute__transaction__client__user", "dispute__transaction__professional__user", "uploader")

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        if user.is_staff and (user.is_superuser or user.has_perm("trustops.manage_trust_cases")):
            return qs
        profile = user.profile
        return qs.filter(Q(dispute__transaction__client=profile) | Q(dispute__transaction__professional=profile)).distinct()

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        evidence = self.get_object()
        raw = decrypt_dispute_evidence(evidence)
        response = HttpResponse(raw, content_type=evidence.content_type)
        safe_name = evidence.filename.replace('"', "")
        response["Content-Disposition"] = f'attachment; filename="{safe_name}"'
        response["Cache-Control"] = "private, no-store, max-age=0"
        response["Pragma"] = "no-cache"
        response["X-Content-Type-Options"] = "nosniff"
        return response


class ReviewViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "trust_review"

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        if self.action == "moderate":
            return [permissions.IsAuthenticated(), IsReviewModerator()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Review.objects.select_related("booking", "transaction", "client__user", "professional__user").prefetch_related("reports")
        user = self.request.user
        if not user.is_authenticated:
            qs = qs.filter(moderation_status=Review.ModerationStatus.PUBLISHED)
        elif user.is_staff and (user.is_superuser or user.has_perm("trustops.moderate_reviews")):
            pass
        else:
            profile = user.profile
            qs = qs.filter(Q(moderation_status=Review.ModerationStatus.PUBLISHED) | Q(client=profile) | Q(professional=profile)).distinct()
        professional = self.request.query_params.get("professional", "").strip()
        if professional:
            qs = qs.filter(Q(professional__username=professional) | Q(professional__pk=professional.lstrip("@") if professional.lstrip("@").isdigit() else None))
        return qs

    def get_serializer_class(self):
        return ReviewCreateSerializer if self.action == "create" else ReviewSerializer

    def create(self, request, *args, **kwargs):
        serializer = ReviewCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        review = create_review(
            tx=values["transaction"],
            user=request.user,
            rating=values["rating"],
            title=values.get("title", ""),
            body=values.get("body", ""),
        )
        return Response(ReviewSerializer(review, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def report(self, request, pk=None):
        serializer = ReviewReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = report_review(
            review=self.get_object(),
            reporter=request.user.profile,
            reason=serializer.validated_data["reason"],
            details=serializer.validated_data.get("details", ""),
        )
        return Response({"id": str(report.id), "status": report.status}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsReviewModerator])
    def moderate(self, request, pk=None):
        serializer = ReviewModerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = moderate_review(review=self.get_object(), actor=request.user, **serializer.validated_data)
        return Response(ReviewSerializer(review, context={"request": request}).data)


class SupportCaseViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "trust_support"

    def get_queryset(self):
        user = self.request.user
        qs = SupportCase.objects.select_related("opened_by__user", "transaction", "dispute", "review", "assigned_to").prefetch_related("notes__author", "audit_events__actor")
        if user.is_staff and (user.is_superuser or user.has_perm("trustops.manage_support_cases")):
            status_filter = self.request.query_params.get("status", "").strip()
            return qs.filter(status=status_filter) if status_filter else qs
        return qs.filter(opened_by=user.profile)

    def get_serializer_class(self):
        return SupportCaseCreateSerializer if self.action == "create" else SupportCaseSerializer

    def create(self, request, *args, **kwargs):
        serializer = SupportCaseCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        case = open_support_case(profile=request.user.profile, **values)
        return Response(SupportCaseSerializer(case, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def note(self, request, pk=None):
        serializer = SupportNoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = add_support_note(self.get_object(), actor=request.user, **serializer.validated_data)
        return Response({"id": note.id, "created_at": note.created_at}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsSupportOperator])
    def escalate(self, request, pk=None):
        serializer = SupportEscalateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        case = escalate_support_case(self.get_object(), actor=request.user, **serializer.validated_data)
        return Response(SupportCaseSerializer(case, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsSupportOperator])
    def resolve(self, request, pk=None):
        serializer = SupportResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        case = resolve_support_case(self.get_object(), actor=request.user, reason=serializer.validated_data["reason"])
        return Response(SupportCaseSerializer(case, context={"request": request}).data)


class FraudSignalViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsFraudReviewer]
    serializer_class = FraudSignalSerializer

    def get_queryset(self):
        qs = FraudSignal.objects.select_related("profile__user", "transaction", "dispute", "support_case", "reviewed_by")
        status_filter = self.request.query_params.get("status", "").strip()
        severity = self.request.query_params.get("severity", "").strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        if severity:
            qs = qs.filter(severity=severity)
        return qs

    @action(detail=True, methods=["post"])
    def decision(self, request, pk=None):
        signal = self.get_object()
        target = str(request.data.get("status") or "").strip()
        if target not in {FraudSignal.Status.REVIEWED, FraudSignal.Status.DISMISSED, FraudSignal.Status.ACTIONED}:
            raise ValidationError("Choose reviewed, dismissed or actioned.")
        signal.status = target
        signal.reviewed_by = request.user
        signal.reviewed_at = timezone.now()
        signal.save(update_fields=["status", "reviewed_by", "reviewed_at"])
        return Response(FraudSignalSerializer(signal).data)
