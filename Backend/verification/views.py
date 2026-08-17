from django.http import HttpResponse
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import VerificationDocument, VerificationSubmission
from .permissions import IsVerificationReviewer
from .serializers import (
    VerificationDecisionSerializer,
    VerificationDocumentSerializer,
    VerificationResubmitSerializer,
    VerificationSubmissionSerializer,
    VerificationSubmitSerializer,
)
from .services import audit, decrypt_document


class VerificationSubmissionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = VerificationSubmission.objects.select_related("professional__user", "reviewer").prefetch_related("documents", "audit_events__actor")
        if user.is_staff and (user.is_superuser or user.has_perm("verification.review_verification")):
            status_filter = self.request.query_params.get("status", "").strip()
            return qs.filter(status=status_filter) if status_filter else qs
        profile = user.profile
        return qs.filter(professional=profile) if user.role == "professional" else qs.none()

    def get_serializer_class(self):
        if self.action == "create":
            return VerificationSubmitSerializer
        if self.action == "resubmit":
            return VerificationResubmitSerializer
        return VerificationSubmissionSerializer

    def create(self, request, *args, **kwargs):
        profile = request.user.profile
        if request.user.role != "professional":
            raise PermissionDenied("Only professional accounts can submit verification.")
        if VerificationSubmission.objects.filter(professional=profile).exists():
            raise ValidationError("A verification submission already exists. Use resubmit when action is required.")
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()
        return Response(VerificationSubmissionSerializer(submission, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        profile = request.user.profile
        if request.user.role != "professional":
            raise PermissionDenied("Verification applies to professional accounts.")
        submission = self.get_queryset().filter(professional=profile).first()
        if not submission:
            return Response({"status": "not_submitted"})
        return Response(VerificationSubmissionSerializer(submission, context={"request": request}).data)

    @action(detail=False, methods=["post"], url_path="resubmit")
    def resubmit(self, request):
        profile = request.user.profile
        if request.user.role != "professional":
            raise PermissionDenied("Verification applies to professional accounts.")
        submission = VerificationSubmission.objects.filter(professional=profile).first()
        if not submission:
            raise ValidationError("Submit verification first.")
        if submission.status not in {VerificationSubmission.Status.REJECTED, VerificationSubmission.Status.MORE_INFO}:
            raise ValidationError("Resubmission is only available after rejection or a request for more information.")
        serializer = VerificationResubmitSerializer(data=request.data, context={"request": request, "submission": submission})
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()
        return Response(VerificationSubmissionSerializer(submission, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="start-review", permission_classes=[permissions.IsAuthenticated, IsVerificationReviewer])
    def start_review(self, request, pk=None):
        submission = self.get_object()
        if submission.status not in {VerificationSubmission.Status.SUBMITTED, VerificationSubmission.Status.IN_REVIEW}:
            raise ValidationError("Only submitted verification can enter review.")
        old = submission.status
        now = timezone.now()
        submission.status = VerificationSubmission.Status.IN_REVIEW
        submission.reviewer = request.user
        if not submission.review_started_at:
            submission.review_started_at = now
        submission.save(update_fields=["status", "reviewer", "review_started_at", "updated_at"])
        audit(submission, "review_started", actor=request.user, old=old, new=submission.status)
        return Response(VerificationSubmissionSerializer(submission, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsVerificationReviewer])
    def decision(self, request, pk=None):
        submission = self.get_object()
        if submission.status not in {VerificationSubmission.Status.SUBMITTED, VerificationSubmission.Status.IN_REVIEW}:
            raise ValidationError("This submission is not awaiting a decision.")
        serializer = VerificationDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old = submission.status
        target = serializer.validated_data["status"]
        reason = serializer.validated_data["reason"]
        submission.status = target
        submission.reviewer = request.user
        submission.decision_at = timezone.now()
        submission.decision_reason = reason if target != VerificationSubmission.Status.MORE_INFO else ""
        submission.more_info_request = reason if target == VerificationSubmission.Status.MORE_INFO else ""
        submission.save()
        audit(submission, "decision", actor=request.user, old=old, new=target, reason=reason, metadata={"version": submission.version})
        return Response(VerificationSubmissionSerializer(submission, context={"request": request}).data)


class VerificationDocumentViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VerificationDocumentSerializer
    queryset = VerificationDocument.objects.select_related("submission__professional__user")

    def _can_access(self, request, document):
        if request.user.is_staff and (request.user.is_superuser or request.user.has_perm("verification.review_verification")):
            return True
        return document.submission.professional.user_id == request.user.id

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        document = self.get_object()
        if not self._can_access(request, document):
            raise PermissionDenied("You cannot access this verification document.")
        raw = decrypt_document(document)
        response = HttpResponse(raw, content_type=document.content_type)
        safe_name = document.filename.replace('"', "")
        response["Content-Disposition"] = f'attachment; filename="{safe_name}"'
        response["Cache-Control"] = "private, no-store, max-age=0"
        response["Pragma"] = "no-cache"
        response["X-Content-Type-Options"] = "nosniff"
        return response
