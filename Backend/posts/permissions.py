from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsPostOwnerOrReadOnly(BasePermission):
    """Allow everyone to read posts, but only the author to change them."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        profile = getattr(request.user, "profile", None)
        return bool(request.user.is_authenticated and profile and obj.author_id == profile.pk)


class IsProfileOwnerOrReadOnly(BasePermission):
    """Owner permission for Comment/Reply models that expose a `user` Profile FK."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        profile = getattr(request.user, "profile", None)
        return bool(request.user.is_authenticated and profile and obj.user_id == profile.pk)


class IsLikeOwner(BasePermission):
    """Likes are private mutations: only the profile that created a like may mutate it."""

    def has_object_permission(self, request, view, obj):
        profile = getattr(request.user, "profile", None)
        return bool(request.user.is_authenticated and profile and obj.user_id == profile.pk)
