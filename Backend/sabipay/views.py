import json

from django.db.models import Q
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from verification.services import is_professional_verified

from . import gateway
from .models import PaymentAttempt, PayoutDestination, Transaction
from .permissions import IsSabiPayOperator
from .serializers import (
    AdminRefundSerializer,
    InitializePaymentSerializer,
    PayoutDestinationCreateSerializer,
    PayoutDestinationSerializer,
    TransactionSerializer,
    VerifyPaymentSerializer,
)
from .services import (
    create_payout_destination,
    initialize_checkout,
    mark_delivered,
    process_webhook,
    reconcile_transaction,
    release_transaction,
    request_refund,
    start_service,
    verify_attempt,
)


class TransactionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.select_related(
            "booking", "client__user", "professional__user", "payout__destination"
        ).prefetch_related("payment_attempts", "audit_events__actor")
        if user.is_staff and (user.is_superuser or user.has_perm("sabipay.manage_sabipay")):
            state_filter = self.request.query_params.get("state", "").strip()
            return qs.filter(state=state_filter) if state_filter else qs
        profile = user.profile
        return qs.filter(Q(client=profile) | Q(professional=profile)).distinct()

    @action(detail=False, methods=["post"])
    def initialize(self, request):
        serializer = InitializePaymentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.context["booking"]
        tx, attempt = initialize_checkout(
            booking=booking,
            actor=request.user,
            idempotency_key=request.headers.get("Idempotency-Key"),
            return_url=serializer.validated_data.get("return_url"),
        )
        return Response(
            {
                "transaction": TransactionSerializer(tx, context={"request": request}).data,
                "checkout_url": attempt.authorization_url,
                "reference": attempt.reference,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        tx = self.get_object()
        if tx.client.user_id != request.user.id:
            raise PermissionDenied("Only the paying client can verify this checkout.")
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reference = serializer.validated_data.get("reference") or ""
        if reference:
            attempt = tx.payment_attempts.filter(reference=reference).first()
        else:
            attempt = tx.payment_attempts.first()
        if not attempt:
            raise ValidationError("No SabiPay payment attempt exists for this booking.")
        tx = verify_attempt(attempt, source="client")
        return Response(TransactionSerializer(tx, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="start-service")
    def start_service_action(self, request, pk=None):
        tx = start_service(self.get_object(), request.user)
        return Response(TransactionSerializer(tx, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="mark-delivered")
    def mark_delivered_action(self, request, pk=None):
        tx = mark_delivered(self.get_object(), request.user)
        return Response(TransactionSerializer(tx, context={"request": request}).data)

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
        tx = reconcile_transaction(self.get_object())
        return Response(TransactionSerializer(tx, context={"request": request}).data)


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
        destination = create_payout_destination(
            professional=profile,
            actor=request.user,
            **serializer.validated_data,
        )
        return Response(PayoutDestinationSerializer(destination).data, status=status.HTTP_200_OK)


class BankListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.profile.role != "professional":
            raise PermissionDenied("Bank payout setup is available to professional profiles.")
        try:
            banks = gateway.list_banks()
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
        process_webhook(raw_body, payload)
        return Response({"received": True})
