from django.conf import settings
from rest_framework import status
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DonorProfile
from .serializers import NearbyDonorSerializer
from .services import DonorProfileService


class InternalAPIKeyPermission(BasePermission):
    message = "Invalid or missing internal API key."

    def has_permission(self, request, view):
        return request.headers.get("X-Internal-API-Key", "") == settings.INTERNAL_API_KEY


class InternalCreateDonorProfileView(APIView):
    authentication_classes = []
    permission_classes = [InternalAPIKeyPermission]
    swagger_schema = None

    def post(self, request):
        try:
            profile = DonorProfileService().create_profile(**request.data)
            return Response({"profile_id": str(profile.id)}, status=status.HTTP_201_CREATED)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)


class InternalNearbyDonorsView(APIView):
    authentication_classes = []
    permission_classes = [InternalAPIKeyPermission]
    swagger_schema = None

    def get(self, request):
        blood_type = request.query_params.get("blood_type")
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        if not blood_type or lat is None or lng is None:
            return Response({"detail": "blood_type, lat, and lng are required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            donors = DonorProfileService().find_nearby(
                blood_type_needed=blood_type,
                lat=float(lat),
                lng=float(lng),
                radius_km=int(request.query_params.get("radius_km", settings.DEFAULT_MATCHING_RADIUS_KM)),
            )
        except ValueError:
            return Response({"detail": "Invalid numeric query parameter."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"count": len(donors), "donors": NearbyDonorSerializer(donors, many=True).data})


class InternalDonorProfileStatusView(APIView):
    authentication_classes = []
    permission_classes = [InternalAPIKeyPermission]
    swagger_schema = None

    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            profile = DonorProfile.objects.get(user_id=user_id)
        except DonorProfile.DoesNotExist:
            return Response({"detail": "Donor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        profile_complete = bool(profile.phone.strip() and profile.city.strip() and profile.blood_type and profile.blood_type != "UNKNOWN")
        return Response(
            {
                "profile_complete": profile_complete,
                "phone": profile.phone,
                "city": profile.city,
                "blood_type": profile.blood_type,
                "gender": profile.gender,
                "first_name": profile.first_name,
                "last_name": profile.last_name,
            }
        )
