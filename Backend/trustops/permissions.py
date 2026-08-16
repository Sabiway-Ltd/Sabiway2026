from rest_framework.permissions import BasePermission


class IsTrustReviewer(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff and (user.is_superuser or user.has_perm("trustops.manage_trust_cases")))


class IsReviewModerator(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff and (user.is_superuser or user.has_perm("trustops.moderate_reviews")))


class IsSupportOperator(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff and (user.is_superuser or user.has_perm("trustops.manage_support_cases")))


class IsFraudReviewer(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff and (user.is_superuser or user.has_perm("trustops.manage_fraud_signals")))
