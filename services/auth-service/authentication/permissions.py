from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    message = "This endpoint requires administrator privileges."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "ADMIN")


class IsVerifiedHospital(BasePermission):
    message = "Your hospital account must be verified by an administrator."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "HOSPITAL" and request.user.is_verified)


class IsDonor(BasePermission):
    message = "This endpoint is for donors only."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "DONOR")
