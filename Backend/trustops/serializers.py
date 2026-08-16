from rest_framework import serializers

from profiles.serializers import ProfileSerializer
from sabipay.models import Dispute, Transaction

from .models import DisputeCase, DisputeEvidence, DisputeNote, FraudSignal, Review, ReviewReport, SupportAudit, SupportCase, SupportNote


class BlankablePrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        if data in ("", None):
            return None
        return super().to_internal_value(data)


class DisputeEvidenceSerializer(serializers.ModelSerializer):
    uploader_email = serializers.EmailField(source="uploader.email", read_only=True)
    class Meta:
        model = DisputeEvidence
        fields = ["id", "filename", "content_type", "size", "uploader_email", "created_at"]


class DisputeNoteSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source="author.email", read_only=True)
    class Meta:
        model = DisputeNote
        fields = ["id", "author_email", "body", "internal", "created_at"]


class DisputeCaseSerializer(serializers.ModelSerializer):
    transaction_id = serializers.UUIDField(source="dispute.transaction_id", read_only=True)
    receipt_number = serializers.CharField(source="dispute.transaction.receipt_number", read_only=True)
    dispute_status = serializers.CharField(source="dispute.status", read_only=True)
    reason = serializers.CharField(source="dispute.reason", read_only=True)
    details = serializers.CharField(source="dispute.details", read_only=True)
    opened_by_email = serializers.EmailField(source="dispute.opened_by.email", read_only=True)
    evidence_items = DisputeEvidenceSerializer(source="dispute.evidence_items", many=True, read_only=True)
    notes = serializers.SerializerMethodField()
    class Meta:
        model = DisputeCase
        fields = ["id", "transaction_id", "receipt_number", "dispute_status", "reason", "details", "opened_by_email", "priority", "response_due_at", "decision", "decision_reason", "provider_release_amount", "client_refund_amount", "resolved_at", "evidence_items", "notes", "created_at", "updated_at"]
    def get_notes(self, obj):
        request = self.context.get("request"); is_staff = bool(request and request.user.is_authenticated and request.user.is_staff)
        qs = obj.dispute.case_notes.all()
        if not is_staff: qs = qs.filter(internal=False)
        return DisputeNoteSerializer(qs, many=True).data


class DisputeCreateSerializer(serializers.Serializer):
    transaction_id = serializers.PrimaryKeyRelatedField(source="transaction", queryset=Transaction.objects.all())
    reason = serializers.CharField(max_length=80)
    details = serializers.CharField(required=False, allow_blank=True)
    evidence = serializers.FileField(required=False, allow_null=True)
    def validate_transaction_id(self, tx):
        user = self.context["request"].user
        if user.id not in {tx.client.user_id, tx.professional.user_id}:
            raise serializers.ValidationError("You are not a participant in this transaction.")
        return tx


class DisputeDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=[DisputeCase.Decision.RELEASE_FULL, DisputeCase.Decision.REFUND_FULL, DisputeCase.Decision.PARTIAL])
    reason = serializers.CharField(min_length=8)


class DisputeNoteCreateSerializer(serializers.Serializer):
    body = serializers.CharField(min_length=1)
    internal = serializers.BooleanField(default=True)


class ReviewSerializer(serializers.ModelSerializer):
    client = ProfileSerializer(read_only=True)
    professional = ProfileSerializer(read_only=True)
    report_count = serializers.IntegerField(source="reports.count", read_only=True)
    class Meta:
        model = Review
        fields = ["id", "booking", "transaction", "client", "professional", "rating", "title", "body", "moderation_status", "moderation_reason", "report_count", "created_at", "updated_at"]
        read_only_fields = ["id", "booking", "transaction", "client", "professional", "moderation_status", "moderation_reason", "report_count", "created_at", "updated_at"]


class ReviewCreateSerializer(serializers.Serializer):
    transaction_id = serializers.PrimaryKeyRelatedField(source="transaction", queryset=Transaction.objects.all())
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=120, required=False, allow_blank=True)
    body = serializers.CharField(required=False, allow_blank=True)


class ReviewReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewReport
        fields = ["id", "review", "reporter", "reason", "details", "status", "reviewed_at", "created_at"]
        read_only_fields = ["id", "review", "reporter", "status", "reviewed_at", "created_at"]


class ReviewReportCreateSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=80)
    details = serializers.CharField(required=False, allow_blank=True)


class ReviewModerationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["publish", "hide", "remove"])
    reason = serializers.CharField(required=False, allow_blank=True)


class SupportNoteSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source="author.email", read_only=True)
    class Meta:
        model = SupportNote
        fields = ["id", "author_email", "body", "internal", "created_at"]


class SupportAuditSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True, allow_null=True)
    class Meta:
        model = SupportAudit
        fields = ["id", "actor_email", "event", "from_status", "to_status", "reason", "metadata", "created_at"]


class SupportCaseSerializer(serializers.ModelSerializer):
    opened_by = ProfileSerializer(read_only=True)
    notes = serializers.SerializerMethodField()
    audit_events = SupportAuditSerializer(many=True, read_only=True)
    class Meta:
        model = SupportCase
        fields = ["id", "opened_by", "transaction", "dispute", "review", "category", "summary", "details", "status", "priority", "response_due_at", "escalated_at", "resolved_at", "notes", "audit_events", "created_at", "updated_at"]
    def get_notes(self, obj):
        request = self.context.get("request"); is_staff = bool(request and request.user.is_authenticated and request.user.is_staff)
        qs = obj.notes.all()
        if not is_staff: qs = qs.filter(internal=False)
        return SupportNoteSerializer(qs, many=True).data


class SupportCaseCreateSerializer(serializers.Serializer):
    category = serializers.CharField(max_length=80)
    summary = serializers.CharField(max_length=180)
    details = serializers.CharField(required=False, allow_blank=True)
    transaction_id = BlankablePrimaryKeyRelatedField(source="transaction", queryset=Transaction.objects.all(), required=False, allow_null=True)
    dispute_id = BlankablePrimaryKeyRelatedField(source="dispute", queryset=Dispute.objects.all(), required=False, allow_null=True)
    review_id = BlankablePrimaryKeyRelatedField(source="review", queryset=Review.objects.all(), required=False, allow_null=True)
    def validate(self, attrs):
        user = self.context["request"].user; tx = attrs.get("transaction"); dispute = attrs.get("dispute"); review = attrs.get("review")
        if tx and user.id not in {tx.client.user_id, tx.professional.user_id}: raise serializers.ValidationError("You are not a participant in this transaction.")
        if dispute and user.id not in {dispute.transaction.client.user_id, dispute.transaction.professional.user_id}: raise serializers.ValidationError("You are not a participant in this dispute.")
        if review and user.id not in {review.client.user_id, review.professional.user_id}: raise serializers.ValidationError("You are not part of this review journey.")
        return attrs


class SupportNoteCreateSerializer(serializers.Serializer):
    body = serializers.CharField(min_length=1)
    internal = serializers.BooleanField(default=False)


class SupportEscalateSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5)
    priority = serializers.ChoiceField(choices=[SupportCase.Priority.HIGH, SupportCase.Priority.CRITICAL], default=SupportCase.Priority.HIGH)


class SupportResolveSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5)


class FraudSignalSerializer(serializers.ModelSerializer):
    class Meta:
        model = FraudSignal
        fields = ["id", "profile", "transaction", "dispute", "support_case", "code", "severity", "status", "context", "reviewed_at", "created_at"]
        read_only_fields = fields
