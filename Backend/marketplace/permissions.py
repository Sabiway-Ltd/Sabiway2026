from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsListingOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user.is_authenticated and obj.provider_id == request.user.profile.pk)
