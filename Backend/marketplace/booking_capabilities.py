from django.db.models import Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BookingRequest, ScheduleProposal


def allowed_status_transitions(booking, profile):
    if profile.pk == booking.client_id:
        allowed = {
            BookingRequest.Status.PENDING: [BookingRequest.Status.CANCELLED],
            BookingRequest.Status.ACCEPTED: [BookingRequest.Status.CANCELLED, BookingRequest.Status.IN_PROGRESS],
            BookingRequest.Status.IN_PROGRESS: [BookingRequest.Status.COMPLETED],
        }
    elif profile.pk == booking.professional_id:
        allowed = {
            BookingRequest.Status.PENDING: [BookingRequest.Status.ACCEPTED, BookingRequest.Status.DECLINED],
            BookingRequest.Status.ACCEPTED: [BookingRequest.Status.CANCELLED, BookingRequest.Status.IN_PROGRESS],
            BookingRequest.Status.IN_PROGRESS: [BookingRequest.Status.COMPLETED],
        }
    else:
        return []
    return allowed.get(booking.status, [])


def booking_capability_payload(booking, profile):
    active_proposal = next(
        (
            proposal
            for proposal in booking.schedule_proposals.all()
            if proposal.status == ScheduleProposal.Status.PROPOSED
        ),
        None,
    )
    participant = profile.pk in {booking.client_id, booking.professional_id}
    scheduling_open = participant and booking.status in {
        BookingRequest.Status.ACCEPTED,
        BookingRequest.Status.IN_PROGRESS,
    }
    can_respond = bool(
        active_proposal
        and active_proposal.proposer_id != profile.pk
        and active_proposal.status == ScheduleProposal.Status.PROPOSED
    )
    return {
        "booking_id": str(booking.id),
        "available_status_transitions": allowed_status_transitions(booking, profile),
        "can_propose_schedule": scheduling_open,
        "can_respond_to_active_schedule": can_respond,
        "active_schedule_proposal_id": str(active_proposal.id) if active_proposal else None,
    }


class BookingCapabilitiesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user.profile
        bookings = (
            BookingRequest.objects.select_related("client", "professional")
            .prefetch_related("schedule_proposals")
            .filter(Q(client=me) | Q(professional=me))
            .distinct()
        )
        return Response([booking_capability_payload(booking, me) for booking in bookings])
