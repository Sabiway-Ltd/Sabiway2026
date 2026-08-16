from django.contrib import admin, messages

from .models import (
    Dispute,
    GatewayWebhookEvent,
    PaymentAttempt,
    PayoutDestination,
    PayoutRecord,
    Transaction,
    TransactionAudit,
)
from .services import reconcile_transaction, release_transaction, request_refund


class PaymentAttemptInline(admin.TabularInline):
    model = PaymentAttempt
    extra = 0
    can_delete = False
    readonly_fields = ("reference", "idempotency_key", "status", "gateway_transaction_id", "failure_reason", "created_at", "completed_at")
    fields = readonly_fields


class PayoutInline(admin.StackedInline):
    model = PayoutRecord
    extra = 0
    can_delete = False
    readonly_fields = ("destination", "amount", "currency", "reference", "transfer_code", "status", "initiated_at", "completed_at", "failure_reason", "created_at", "updated_at")
    fields = readonly_fields


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("receipt_number", "client", "professional", "amount", "currency", "state", "commission_amount", "provider_amount", "reconciliation_status", "release_eligible_at", "created_at")
    list_filter = ("state", "reconciliation_status", "refund_status", "currency", "created_at")
    search_fields = ("receipt_number", "funding_reference", "client__full_name", "professional__full_name", "booking__scope_summary")
    readonly_fields = (
        "id", "booking", "client", "professional", "amount", "currency", "commission_rate", "commission_amount", "provider_amount",
        "state", "gateway", "funding_reference", "gateway_transaction_id", "receipt_number", "funded_at", "service_started_at", "delivered_at",
        "release_eligible_at", "client_confirmed_at", "released_at", "cancelled_at", "refunded_at", "refund_status", "refund_gateway_id", "refund_reason",
        "reconciliation_status", "reconciliation_note", "reconciled_at", "created_at", "updated_at",
    )
    inlines = [PaymentAttemptInline, PayoutInline]
    actions = ["reconcile_selected"]

    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False
    def has_change_permission(self, request, obj=None):
        return bool(request.user.is_superuser or request.user.has_perm("sabipay.manage_sabipay"))

    @admin.action(description="Reconcile selected transactions with Paystack")
    def reconcile_selected(self, request, queryset):
        count = 0
        for tx in queryset:
            reconcile_transaction(tx)
            count += 1
        self.message_user(request, f"Reconciled {count} transaction(s).", level=messages.SUCCESS)


@admin.register(PayoutDestination)
class PayoutDestinationAdmin(admin.ModelAdmin):
    list_display = ("professional", "bank_name", "bank_code", "account_last4", "is_active", "verified_at")
    list_filter = ("is_active", "bank_code")
    search_fields = ("professional__full_name", "professional__username", "account_name", "recipient_code")
    readonly_fields = ("id", "professional", "gateway", "recipient_code", "account_name", "bank_code", "bank_name", "account_last4", "verified_at", "created_at", "updated_at")
    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False


@admin.register(PayoutRecord)
class PayoutRecordAdmin(admin.ModelAdmin):
    list_display = ("reference", "transaction", "amount", "currency", "status", "initiated_at", "completed_at")
    list_filter = ("status", "currency", "created_at")
    search_fields = ("reference", "transaction__receipt_number", "destination__professional__full_name")
    readonly_fields = ("id", "transaction", "destination", "amount", "currency", "reference", "transfer_code", "status", "initiated_at", "completed_at", "failure_reason", "created_at", "updated_at")
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ("transaction", "opened_by", "reason", "status", "created_at", "resolved_at")
    list_filter = ("status", "created_at")
    search_fields = ("transaction__receipt_number", "opened_by__email", "reason", "details")
    readonly_fields = ("id", "transaction", "opened_by", "reason", "details", "status", "resolution", "created_at", "resolved_at")
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


@admin.register(TransactionAudit)
class TransactionAuditAdmin(admin.ModelAdmin):
    list_display = ("transaction", "event", "source", "actor", "from_state", "to_state", "created_at")
    list_filter = ("source", "event", "from_state", "to_state", "created_at")
    search_fields = ("transaction__receipt_number", "event", "actor__email", "reason")
    readonly_fields = ("id", "transaction", "actor", "source", "event", "from_state", "to_state", "reason", "metadata", "event_key", "created_at")
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


@admin.register(GatewayWebhookEvent)
class GatewayWebhookEventAdmin(admin.ModelAdmin):
    list_display = ("event_name", "reference", "processed", "processing_note", "received_at", "processed_at")
    list_filter = ("processed", "event_name", "received_at")
    search_fields = ("reference", "digest", "processing_note")
    readonly_fields = ("id", "digest", "event_name", "reference", "processed", "processing_note", "received_at", "processed_at")
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
