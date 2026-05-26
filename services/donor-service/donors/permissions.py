from rest_framework.permissions import BasePermission


class IsDonor(BasePermission):
    message = "Only registered donors can access this resource."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, "role", None) == "DONOR")


class IsVerifiedHospitalOrAdmin(BasePermission):
    message = "Only verified hospitals or admins can access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(request.user, "role", None)
        is_verified = getattr(request.user, "is_verified", False)
        return role == "ADMIN" or (role == "HOSPITAL" and is_verified)
