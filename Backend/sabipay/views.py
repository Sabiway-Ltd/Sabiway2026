import json

from django.db.models import Q
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from marketplace.markets import default_currency_for_country, normalise_country_code
from verification.services import is_professional_verified

from . import gateway, orchestration
from .models import Dispute, PayoutDestination, Transaction
from .permissions import IsSabiPayOperator
from .serializers import (
    AdminRefundSerializer,
    DisputeEvidenceCreateSerializer,
    DisputeEvidenceSerializer,
    DisputeResolutionSerializer,
    DisputeSerializer,
    InitializePaymentSerializer,
    OpenDisputeSerializer,
    PayoutDestinationCreateSerializer,
    PayoutDestinationSerializer,
    TransactionSerializer,
    VerifyPaymentSerializer,
)
from .services import (
    add_dispute_evidence,
    create_payout_destination,
    initialize_checkout,
    mark_delivered,
    open_dispute,
    reconcile_transaction,
    release_transaction,
    request_refund,
    resolve_dispute,
    start_dispute_review,
    start_service,
    verify_attempt,
)
from .webhook_services import process_paystack_webhook


class TransactionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.select_related("booking", "client__user", "professional__user", "payout__destination").prefetch_related("payment_attempts", "fx_quotes", "audit_events__actor", "disputes__evidence__submitted_by")
        if user.is_staff and (user.is_superuser or user.has_perm("sabipay.manage_sabipay")):
            state_filter = self.request.query_params.get("state", "").strip()
            payment_filter = self.request.query_params.get("payment_status", "").strip()
            if state_filter:
                qs = qs.filter(state=state_filter)
            if payment_filter:
                qs = qs.filter(payment_status=payment_filter)
            return qs
        profile = user.profile
        return qs.filter(Q(client=profile) | Q(professional=profile)).distinct()

    @action(detail=False, methods=["post"])
    def initialize(self, request):
        serializer = InitializePaymentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.context["booking"]
        tx, attempt = initialize_checkout(booking=booking, actor=request.user, idempotency_key=request.headers.get("Idempotency-Key"), return_url=serializer.validated_data.get("return_url"))
        return Response({"transaction": TransactionSerializer(tx, context={"request": request}).data, "checkout_url": attempt.authorization_url, "reference": attempt.reference}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        tx = self.get_object()
        if tx.client.user_id != request.user.id:
            raise PermissionDenied("Only the paying client can verify this checkout.")
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reference = serializer.validated_data.get("reference") or ""
        attempt = tx.payment_attempts.filter(reference=reference).first() if reference else tx.payment_attempts.first()
        if not attempt:
            raise ValidationError("No SabiPay payment attempt exists for this booking.")
        tx = verify_attempt(attempt, source="client")
        return Response(TransactionSerializer(tx, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="refresh-status")
    def refresh_status(self, request, pk=None):
        return Response(TransactionSerializer(reconcile_transaction(self.get_object()), context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="start-service")
    def start_service_action(self, request, pk=None):
        return Response(TransactionSerializer(start_service(self.get_object(), request.user), context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="mark-delivered")
    def mark_delivered_action(self, request, pk=None):
        return Response(TransactionSerializer(mark_delivered(self.get_object(), request.user), context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="confirm-satisfaction")
    def confirm_satisfaction(self, request, pk=None):
        tx, _ = release_transaction(self.get_object(), actor=request.user, source="client", client_confirmed=True)
        return Response(TransactionSerializer(tx, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="admin-release", permission_classes=[permissions.IsAuthenticated, IsSabiPayOperator])
    def admin_release(self, request, pk=None):
        tx, _ = release_transaction(self.get_object(), actor=request.user, source="admin")
        return Response(TransactionSerializer(tx, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="admin-refund", permission_classes=[permissions.IsAuthenticated, IsSabiPayOperator])
    def admin_refund(self, request, pk=None):
        serializer = AdminRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tx = request_refund(self.get_object(), actor=request.user, reason=serializer.validated_data["reason"])
        return Response(TransactionSerializer(tx, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsSabiPayOperator])
    def reconcile(self, request, pk=None):
        return Response(TransactionSerializer(reconcile_transaction(self.get_object()), context={"request": request}).data)


class DisputeViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Dispute.objects.select_related("transaction__client__user", "transaction__professional__user", "opened_by_profile__user", "assigned_to", "resolved_by").prefetch_related("evidence__submitted_by__user")
        if user.is_staff and (user.is_superuser or user.has_perm("sabipay.manage_sabipay")):
            status_filter = self.request.query_params.get("status", "").strip()
            return qs.filter(status=status_filter) if status_filter else qs
        profile = user.profile
        return qs.filter(Q(transaction__client=profile) | Q(transaction__professional=profile)).distinct()

    def get_serializer_class(self):
        return OpenDisputeSerializer if self.action == "create" else DisputeSerializer

    def create(self, request, *args, **kwargs):
        serializer = OpenDisputeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tx = Transaction.objects.select_related("client__user", "professional__user").filter(Q(client=request.user.profile) | Q(professional=request.user.profile), pk=serializer.validated_data["transaction_id"]).first()
        if not tx:
            raise PermissionDenied("This transaction is not available to your account.")
        dispute = open_dispute(tx, actor=request.user, reason=serializer.validated_data["reason"], details=serializer.validated_data["details"])
        return Response(DisputeSerializer(dispute, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def evidence(self, request, pk=None):
        dispute = self.get_object()
        serializer = DisputeEvidenceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evidence = add_dispute_evidence(dispute, actor=request.user, **serializer.validated_data)
        return Response(DisputeEvidenceSerializer(evidence).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="start-review", permission_classes=[permissions.IsAuthenticated, IsSabiPayOperator])
    def start_review(self, request, pk=None):
        return Response(DisputeSerializer(start_dispute_review(self.get_object(), actor=request.user), context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsSabiPayOperator])
    def resolve(self, request, pk=None):
        serializer = DisputeResolutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dispute = resolve_dispute(self.get_object(), actor=request.user, **serializer.validated_data)
        return Response(DisputeSerializer(dispute, context={"request": request}).data)


class PayoutDestinationViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = self.request.user.profile
        return PayoutDestination.objects.filter(professional=profile) if profile.role == "professional" else PayoutDestination.objects.none()

    def get_serializer_class(self):
        return PayoutDestinationCreateSerializer if self.action == "create" else PayoutDestinationSerializer

    def create(self, request, *args, **kwargs):
        profile = request.user.profile
        if profile.role != "professional":
            raise PermissionDenied("Only professionals configure payout destinations.")
        if not is_professional_verified(profile):
            raise PermissionDenied("Provider verification approval is required before payout setup.")
        serializer = PayoutDestinationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        destination = create_payout_destination(professional=profile, actor=request.user, **serializer.validated_data)
        return Response(PayoutDestinationSerializer(destination).data, status=status.HTTP_200_OK)


class BankListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        if profile.role != "professional":
            raise PermissionDenied("Bank payout setup is available to professional profiles.")
        country_code = normalise_country_code(request.query_params.get("country_code") or profile.country_code or profile.country)
        currency = (request.query_params.get("currency") or default_currency_for_country(country_code)).upper()
        market = orchestration.require_payout_market(country_code, currency)
        if market.provider != "paystack" or country_code != "NG":
            raise ValidationError("Bank discovery is not configured for this payout market yet.")
        try:
            banks = gateway.list_banks(country="nigeria", currency=currency)
        except gateway.PaystackError as exc:
            raise ValidationError(str(exc)) from exc
        return Response(banks)


class PaystackWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_body = request.body
        signature = request.headers.get("x-paystack-signature", "")
        try:
            valid = gateway.verify_webhook_signature(raw_body, signature)
        except gateway.PaystackConfigurationError:
            return Response({"detail": "Gateway not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if not valid:
            return Response({"detail": "Invalid Paystack signature."}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return Response({"detail": "Invalid webhook payload."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            process_paystack_webhook(raw_body, payload)
        except gateway.PaystackError:
            return Response({"detail": "Retry later."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"received": True})
