from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from geopy.distance import geodesic
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DonorProfile, ScreeningCenter
from .permissions import IsDonor, IsVerifiedHospitalOrAdmin
from .serializers import (
    DonationRecordSerializer,
    DonorProfileSerializer,
    NearbyDonorSerializer,
    RecordDonationSerializer,
    ScreeningCenterSerializer,
    UpdateBloodTypeSerializer,
    UpdateProfileSerializer,
    VirtualDonorCardSerializer,
)
from .services import DonorProfileService


class DonorProfileView(APIView):
    permission_classes = [IsAuthenticated, IsDonor]

    @swagger_auto_schema(tags=["Donor Profile"], operation_description="Returns the authenticated donor's profile including eligibility status.")
    def get(self, request):
        try:
            profile = DonorProfileService().get_profile(request.user.user_id)
        except DonorProfile.DoesNotExist:
            return Response({"detail": "Donor profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DonorProfileSerializer(profile).data)

    @swagger_auto_schema(tags=["Donor Profile"], request_body=UpdateProfileSerializer, responses={200: DonorProfileSerializer})
    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            profile = DonorProfileService().update_profile(request.user.user_id, serializer.validated_data)
        except DonorProfile.DoesNotExist:
            return Response({"detail": "Donor profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DonorProfileSerializer(profile).data)


class BloodTypeView(APIView):
    permission_classes = [IsAuthenticated, IsDonor]

    @swagger_auto_schema(tags=["Donor Profile"], request_body=UpdateBloodTypeSerializer, responses={200: DonorProfileSerializer})
    def patch(self, request):
        serializer = UpdateBloodTypeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = DonorProfileService().update_blood_type(request.user.user_id, serializer.validated_data["blood_type"], serializer.validated_data["verified"])
        return Response(DonorProfileSerializer(profile).data)


class AvailabilityToggleView(APIView):
    permission_classes = [IsAuthenticated, IsDonor]

    @swagger_auto_schema(tags=["Donor Profile"], operation_description="Toggles donor availability between AVAILABLE and UNAVAILABLE.")
    def post(self, request):
        profile = DonorProfileService().toggle_availability(request.user.user_id)
        return Response({"availability_status": profile.availability_status, "message": f"Availability set to {profile.availability_status}."})


class DonorCardView(APIView):
    permission_classes = [IsAuthenticated, IsDonor]

    @swagger_auto_schema(tags=["Donor Card"], responses={200: VirtualDonorCardSerializer})
    def get(self, request):
        try:
            return Response(VirtualDonorCardSerializer(DonorProfileService().get_donor_card(request.user.user_id)).data)
        except Exception:
            return Response({"detail": "Donor card not found."}, status=status.HTTP_404_NOT_FOUND)


class DonationHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsDonor]

    @swagger_auto_schema(tags=["Donation History"], responses={200: DonationRecordSerializer(many=True)})
    def get(self, request):
        return Response(DonationRecordSerializer(DonorProfileService().get_donation_history(request.user.user_id), many=True).data)


class RecordDonationView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedHospitalOrAdmin]

    @swagger_auto_schema(tags=["Donation History"], request_body=RecordDonationSerializer, responses={201: DonationRecordSerializer})
    def post(self, request):
        serializer = RecordDonationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        donor_user_id = data.pop("donor_user_id")
        data.setdefault("source_id", None)
        data.setdefault("facility_user_id", None)
        data.setdefault("notes", "")
        try:
            profile = DonorProfile.objects.get(user_id=donor_user_id)
            record = DonorProfileService().record_donation(donor_profile_id=profile.id, recorded_by_user_id=request.user.user_id, **data)
            return Response(DonationRecordSerializer(record).data, status=status.HTTP_201_CREATED)
        except DonorProfile.DoesNotExist:
            return Response({"detail": "Donor not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class ScreeningCentersView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        tags=["Screening Centers"],
        operation_description="Returns nearby blood type screening facilities. Public endpoint; no auth required.",
        manual_parameters=[
            openapi.Parameter("city", openapi.IN_QUERY, type=openapi.TYPE_STRING, required=False),
            openapi.Parameter("lat", openapi.IN_QUERY, type=openapi.TYPE_NUMBER, required=False),
            openapi.Parameter("lng", openapi.IN_QUERY, type=openapi.TYPE_NUMBER, required=False),
        ],
    )
    def get(self, request):
        city = request.query_params.get("city", "").strip()
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        centers = ScreeningCenter.objects.filter(is_active=True)
        if city:
            centers = centers.filter(city__icontains=city)
        elif lat and lng:
            with_dist = []
            for center in centers:
                center._distance_km = round(geodesic((float(lat), float(lng)), (center.latitude, center.longitude)).km, 2)
                with_dist.append(center)
            centers = sorted(with_dist, key=lambda center: center._distance_km)[:10]
        else:
            centers = centers[:20]
        return Response(ScreeningCenterSerializer(centers, many=True).data)
