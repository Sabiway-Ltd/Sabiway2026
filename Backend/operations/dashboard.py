from datetime import timedelta

from django.utils import timezone

from .analytics import measurement_snapshot


def get_dashboard_metrics(user):
    if not (user.is_superuser or user.has_perm("operations.view_operations_dashboard")):
        return None

    from accounts.models import User
    from marketplace.models import BookingRequest, ConversationReport, JobPosting, ServiceListing
    from notifications.models import Notification
    from posts.models import PostReport
    from sabipay.models import Dispute, Transaction
    from verification.models import VerificationSubmission
    from .models import OperationsAudit, SupportCase

    since = timezone.now() - timedelta(hours=24)
    metrics = {
        "users_total": User.objects.count(),
        "users_active": User.objects.filter(is_active=True).count(),
        "support_open": SupportCase.objects.exclude(status__in=[SupportCase.Status.RESOLVED, SupportCase.Status.CLOSED]).count(),
        "support_urgent": SupportCase.objects.filter(priority=SupportCase.Priority.URGENT).exclude(status__in=[SupportCase.Status.RESOLVED, SupportCase.Status.CLOSED]).count(),
        "post_reports_open": PostReport.objects.filter(status=PostReport.Status.OPEN).count(),
        "conversation_reports_open": ConversationReport.objects.filter(status="open").count(),
        "verification_queue": VerificationSubmission.objects.filter(status__in=[VerificationSubmission.Status.SUBMITTED, VerificationSubmission.Status.IN_REVIEW]).count(),
        "listings_pending": ServiceListing.objects.filter(moderation_status="pending").count(),
        "jobs_pending": JobPosting.objects.filter(moderation_status="pending").count(),
        "bookings_active": BookingRequest.objects.filter(status__in=[BookingRequest.Status.PENDING, BookingRequest.Status.ACCEPTED, BookingRequest.Status.IN_PROGRESS]).count(),
        "payments_pending": Transaction.objects.filter(payment_status__in=[Transaction.PaymentStatus.NOT_STARTED, Transaction.PaymentStatus.PENDING]).count(),
        "disputes_open": Dispute.objects.filter(status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]).count(),
        "notifications_24h": Notification.objects.filter(created_at__gte=since).count(),
        "admin_actions_24h": OperationsAudit.objects.filter(created_at__gte=since).count(),
    }
    metrics.update({f"measure_{key}": value for key, value in measurement_snapshot(hours=24).items()})
    return metrics


def install_operations_dashboard(admin_site):
    if getattr(admin_site, "_sabiway_operations_dashboard", False): return
    admin_site._sabiway_operations_dashboard = True
    admin_site.site_header = "SabiWay Shared Administration"
    admin_site.site_title = "SabiWay Admin"
    admin_site.index_title = "Operations, moderation, support and measurement"
    admin_site.index_template = "admin/operations_index.html"
    original_index = admin_site.index
    def index(request, extra_context=None):
        merged = dict(extra_context or {})
        merged["operations_metrics"] = get_dashboard_metrics(request.user)
        return original_index(request, extra_context=merged)
    admin_site.index = index
