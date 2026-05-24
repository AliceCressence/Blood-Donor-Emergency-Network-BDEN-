# profiles/views.py
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DonorProfile
from .serializers import (
    CreateDonorProfileSerializer,
    DonorProfileSerializer,
    UpdateDonorProfileSerializer,
    NearbyDonorSerializer,
)


def get_user_id(request):
    """Extract user_id forwarded by the API gateway in the X-User-Id header."""
    return request.headers.get("X-User-Id")


def require_internal_key(request):
    """Return True if the request carries a valid internal API key."""
    return request.headers.get("X-Internal-API-Key") == settings.INTERNAL_API_KEY


# ─── Internal endpoint (called by auth-service after registration) ────────────

class CreateDonorProfileView(APIView):
    """
    POST /internal/donors/create-profile/
    Called internally by auth-service right after a donor registers.
    Requires X-Internal-API-Key header.
    """
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        if not require_internal_key(request):
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN,
            )

        existing = DonorProfile.objects.filter(
            user_id=request.data.get("user_id")
        ).first()
        if existing:
            return Response(
                {"id": str(existing.id), "created": False},
                status=status.HTTP_200_OK,
            )

        serializer = CreateDonorProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(
            {"id": str(profile.id), "created": True},
            status=status.HTTP_201_CREATED,
        )


# ─── Donor-facing endpoints (user_id forwarded by API gateway) ───────────────

class DonorProfileView(APIView):
    """
    GET  /api/donors/me/   → return own profile
    PUT  /api/donors/me/   → update own profile
    """
    authentication_classes = []
    permission_classes     = []

    def _get_profile(self, user_id):
        try:
            return DonorProfile.objects.get(user_id=user_id)
        except DonorProfile.DoesNotExist:
            return None

    def get(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response(
                {"detail": "Missing X-User-Id header."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        profile = self._get_profile(user_id)
        if not profile:
            return Response(
                {"detail": "Donor profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(DonorProfileSerializer(profile).data)

    def put(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response(
                {"detail": "Missing X-User-Id header."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        profile = self._get_profile(user_id)
        if not profile:
            return Response(
                {"detail": "Donor profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = UpdateDonorProfileSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(DonorProfileSerializer(profile).data)


class ToggleAvailabilityView(APIView):
    """
    POST /api/donors/me/availability/
    Toggle the donor's is_available flag on or off.
    Body: { "is_available": true | false }
    """
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response(
                {"detail": "Missing X-User-Id header."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            profile = DonorProfile.objects.get(user_id=user_id)
        except DonorProfile.DoesNotExist:
            return Response(
                {"detail": "Donor profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if "is_available" in request.data:
            profile.is_available = bool(request.data["is_available"])
        else:
            profile.is_available = not profile.is_available

        profile.save(update_fields=["is_available", "updated_at"])
        return Response({
            "is_available": profile.is_available,
            "message": "Availability updated.",
        })


class NearbyDonorsView(APIView):
    """
    GET /internal/donors/nearby/?city=Yaounde&blood_type=O%2B
    Returns available donors filtered by city and optionally blood type.
    Requires X-Internal-API-Key header.
    """
    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        if not require_internal_key(request):
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN,
            )

        city       = request.query_params.get("city", "").strip()
        blood_type = request.query_params.get("blood_type", "").strip()

        donors = DonorProfile.objects.filter(is_available=True)

        if city:
            donors = donors.filter(city__icontains=city)

        if blood_type:
            compatible = [blood_type]
            if blood_type != "O-":
                compatible.append("O-")
            donors = donors.filter(blood_type__in=compatible)

        donors = donors.exclude(blood_type_status=DonorProfile.BloodTypeStatus.UNKNOWN)

        serializer = NearbyDonorSerializer(donors[:50], many=True)
        return Response({
            "count":  donors.count(),
            "donors": serializer.data,
        })