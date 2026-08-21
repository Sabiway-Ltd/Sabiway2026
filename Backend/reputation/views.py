from django.db.models import Q
from rest_framework import mixins, permissions, viewsets

from .models import ProfessionalReview
from .serializers import ProfessionalReviewSerializer


class ProfessionalReviewViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ProfessionalReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        me = self.request.user.profile
        return ProfessionalReview.objects.select_related(
            "booking", "client__user", "professional__user"
        ).filter(Q(client=me) | Q(professional=me)).distinct()
