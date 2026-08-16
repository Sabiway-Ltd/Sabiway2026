from django.utils import timezone
from rest_framework import serializers

from .models import VerificationAudit, VerificationDocument, VerificationSubmission
from .services import store_document, submit_for_review, validate_document


class VerificationDocumentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = VerificationDocument
        fields = ["id", "kind", "filename", "content_type", "size", "submission_version", "created_at", "retention_until", "purged_at", "download_url"]
        read_only_fields = fields

    def get_download_url(self, obj):
        request = self.context.get("request")
        path = f"/api/verification/documents/{obj.id}/download/"
        return request.build_absolute_uri(path) if request else path


class VerificationAuditSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True, allow_null=True)

    class Meta:
        model = VerificationAudit
        fields = ["id", "event", "actor_email", "from_status", "to_status", "reason", "metadata", "created_at"]
        read_only_fields = fields


class VerificationSubmissionSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source="professional.full_name", read_only=True)
    professional_username = serializers.CharField(source="professional.username", read_only=True)
    documents = VerificationDocumentSerializer(many=True, read_only=True)
    audit_events = VerificationAuditSerializer(many=True, read_only=True)
    sla_overdue = serializers.SerializerMethodField()
    address_verification_required = serializers.SerializerMethodField()

    class Meta:
        model = VerificationSubmission
        fields = [
            "id", "professional_name", "professional_username", "status", "identity_type", "credential_summary",
            "address_line", "city", "state", "country", "version", "submitted_at", "review_started_at",
            "decision_at", "sla_due_at", "decision_reason", "more_info_request", "sla_overdue",
            "address_verification_required", "documents", "audit_events", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_sla_overdue(self, obj):
        return bool(obj.sla_due_at and not obj.decision_at and obj.sla_due_at < timezone.now())

    def get_address_verification_required(self, obj):
        return False


class VerificationSubmitSerializer(serializers.Serializer):
    identity_type = serializers.ChoiceField(choices=VerificationSubmission.IdentityType.choices)
    credential_summary = serializers.CharField(required=False, allow_blank=True, max_length=3000)
    address_line = serializers.CharField(required=False, allow_blank=True, max_length=255)
    city = serializers.CharField(required=False, allow_blank=True, max_length=120)
    state = serializers.CharField(required=False, allow_blank=True, max_length=120)
    country = serializers.CharField(required=False, allow_blank=True, max_length=120)
    identity_document = serializers.FileField(write_only=True)
    credential_document = serializers.FileField(write_only=True, required=False, allow_null=True)
    address_document = serializers.FileField(write_only=True, required=False, allow_null=True)

    def validate(self, attrs):
        validate_document(attrs["identity_document"])
        for field in ("credential_document", "address_document"):
            if attrs.get(field):
                validate_document(attrs[field])
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        profile = request.user.profile
        docs = {
            VerificationDocument.Kind.IDENTITY: validated_data.pop("identity_document"),
            VerificationDocument.Kind.CREDENTIAL: validated_data.pop("credential_document", None),
            VerificationDocument.Kind.ADDRESS: validated_data.pop("address_document", None),
        }
        submission = VerificationSubmission.objects.create(professional=profile, **validated_data)
        submit_for_review(submission, actor=request.user, event="submitted")
        for kind, upload in docs.items():
            if upload:
                store_document(submission, upload, kind)
        return submission


class VerificationResubmitSerializer(VerificationSubmitSerializer):
    def create(self, validated_data):
        request = self.context["request"]
        submission = self.context["submission"]
        docs = {
            VerificationDocument.Kind.IDENTITY: validated_data.pop("identity_document"),
            VerificationDocument.Kind.CREDENTIAL: validated_data.pop("credential_document", None),
            VerificationDocument.Kind.ADDRESS: validated_data.pop("address_document", None),
        }
        for field, value in validated_data.items():
            setattr(submission, field, value)
        submission.version += 1
        submission.save()
        submit_for_review(submission, actor=request.user, event="resubmitted")
        for kind, upload in docs.items():
            if upload:
                store_document(submission, upload, kind)
        return submission


class VerificationDecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        VerificationSubmission.Status.APPROVED,
        VerificationSubmission.Status.REJECTED,
        VerificationSubmission.Status.MORE_INFO,
    ])
    reason = serializers.CharField(required=False, allow_blank=True, max_length=3000)

    def validate(self, attrs):
        if attrs["status"] in {VerificationSubmission.Status.REJECTED, VerificationSubmission.Status.MORE_INFO} and not attrs.get("reason", "").strip():
            raise serializers.ValidationError({"reason": "A clear reason is required for this decision."})
        attrs["reason"] = attrs.get("reason", "").strip()
        return attrs
