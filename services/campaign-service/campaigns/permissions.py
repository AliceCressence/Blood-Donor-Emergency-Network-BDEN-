from rest_framework.permissions import BasePermission


def user_role(user):
    return (getattr(user, "role", "") or "").upper()


class IsVerifiedHospital(BasePermission):
    message = "Only verified hospital accounts can perform this action."

    def has_permission(self, request, _view):
        return bool(request.user and request.user.is_authenticated and user_role(request.user) == "HOSPITAL" and getattr(request.user, "is_verified", False))


class IsAdmin(BasePermission):
    message = "Only platform administrators can perform this action."

    def has_permission(self, request, _view):
        return bool(request.user and request.user.is_authenticated and user_role(request.user) == "ADMIN")


class IsDonor(BasePermission):
    message = "Only donor accounts can perform this action."

    def has_permission(self, request, _view):
        return bool(request.user and request.user.is_authenticated and user_role(request.user) == "DONOR")
