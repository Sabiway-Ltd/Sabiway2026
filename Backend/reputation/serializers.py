from rest_framework import serializers

from marketplace.models import BookingRequest

from .models import ProfessionalReview


class ProfessionalReviewSerializer(serializers.ModelSerializer):
    booking_id = serializers.PrimaryKeyRelatedField(
        source="booking",
        queryset=BookingRequest.objects.select_related("client", "professional").all(),
        write_only=True,
    )
    client_name = serializers.CharField(source="client.full_name", read_only=True)
    professional_username = serializers.CharField(source="professional.username", read_only=True)

    class Meta:
        model = ProfessionalReview
        fields = [
            "id",
            "booking_id",
            "client_name",
            "professional_username",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "client_name",
            "professional_username",
            "created_at",
            "updated_at",
        ]

    def validate_comment(self, value):
        return (value or "").strip()

    def validate(self, attrs):
        request = self.context["request"]
        booking = attrs["booking"]
        me = request.user.profile

        if booking.status != BookingRequest.Status.COMPLETED:
            raise serializers.ValidationError(
                "A review can only be submitted after the booking is completed."
            )
        if me.pk != booking.client_id:
            raise serializers.ValidationError(
                "Only the Client on this booking can review the Professional."
            )
        if not booking.professional_id:
            raise serializers.ValidationError(
                "This booking does not have a Professional to review."
            )
        if booking.professional_id == me.pk:
            raise serializers.ValidationError("You cannot review yourself.")
        if ProfessionalReview.objects.filter(booking=booking).exists():
            raise serializers.ValidationError(
                "A completed-work review already exists for this booking."
            )
        return attrs

    def create(self, validated_data):
        booking = validated_data["booking"]
        return ProfessionalReview.objects.create(
            client=booking.client,
            professional=booking.professional,
            **validated_data,
        )


class PublicProfessionalReviewSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.full_name", read_only=True)

    class Meta:
        model = ProfessionalReview
        fields = ["id", "client_name", "rating", "comment", "created_at"]
