from rest_framework.permissions import BasePermission


class IsSabiPayOperator(BasePermission):
    message = "SabiPay operator permission is required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff and (user.is_superuser or user.has_perm("sabipay.manage_sabipay")))
