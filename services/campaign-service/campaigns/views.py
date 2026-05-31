from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DonationCampaign
from .permissions import IsAdmin, IsDonor, IsVerifiedHospital
from .serializers import (
    CampaignCancelSerializer,
    CampaignProgressSerializer,
    CampaignReviewSerializer,
    CreateCampaignSerializer,
    DonationCampaignSerializer,
    UpdateCampaignSerializer,
)
from .services import CampaignService


class CampaignListCreateView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="List public campaigns",
        manual_parameters=[
            openapi.Parameter("city", openapi.IN_QUERY, type=openapi.TYPE_STRING),
            openapi.Parameter("blood_type", openapi.IN_QUERY, type=openapi.TYPE_STRING),
        ],
        responses={200: DonationCampaignSerializer(many=True)},
        tags=["Campaigns"],
    )
    def get(self, request):
        campaigns = DonationCampaign.objects.get_public(
            city=request.query_params.get("city"),
            blood_type=request.query_params.get("blood_type"),
        )
        return Response(DonationCampaignSerializer(campaigns, many=True).data)

    @swagger_auto_schema(
        operation_summary="Create campaign",
        operation_description="Verified hospitals submit campaigns for admin review. Newly created campaigns are PENDING.",
        request_body=CreateCampaignSerializer,
        responses={201: DonationCampaignSerializer, 400: "Validation error", 403: "Verified hospital required"},
        tags=["Campaigns"],
    )
    def post(self, request):
        permission = IsVerifiedHospital()
        if not permission.has_permission(request, self):
            return Response({"detail": permission.message}, status=status.HTTP_403_FORBIDDEN)
        serializer = CreateCampaignSerializer(data=request.data, context={"hospital_user_id": request.user.id})
        serializer.is_valid(raise_exception=True)
        campaign = CampaignService().create_campaign(request.user.id, serializer.validated_data)
        return Response(DonationCampaignSerializer(campaign).data, status=status.HTTP_201_CREATED)


class CampaignDetailView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(operation_summary="Campaign detail", responses={200: DonationCampaignSerializer}, tags=["Campaigns"])
    def get(self, _request, pk):
        campaign = get_object_or_404(DonationCampaign, pk=pk, status__in=["APPROVED", "ONGOING"])
        return Response(DonationCampaignSerializer(campaign).data)


class NearbyCampaignsView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Nearby campaigns",
        manual_parameters=[
            openapi.Parameter("lat", openapi.IN_QUERY, required=True, type=openapi.TYPE_NUMBER),
            openapi.Parameter("lng", openapi.IN_QUERY, required=True, type=openapi.TYPE_NUMBER),
            openapi.Parameter("radius_km", openapi.IN_QUERY, type=openapi.TYPE_NUMBER),
            openapi.Parameter("city", openapi.IN_QUERY, type=openapi.TYPE_STRING),
            openapi.Parameter("blood_type", openapi.IN_QUERY, type=openapi.TYPE_STRING),
        ],
        responses={200: DonationCampaignSerializer(many=True), 400: "Missing or invalid coordinates"},
        tags=["Campaigns"],
    )
    def get(self, request):
        try:
            lat = float(request.query_params["lat"])
            lng = float(request.query_params["lng"])
            radius = float(request.query_params.get("radius_km", 30))
        except (KeyError, TypeError, ValueError):
            return Response({"detail": "Please provide valid lat and lng query parameters."}, status=status.HTTP_400_BAD_REQUEST)
        campaigns = DonationCampaign.objects.get_nearby(
            lat,
            lng,
            radius_km=radius,
            city=request.query_params.get("city"),
            blood_type=request.query_params.get("blood_type"),
        )
        return Response(DonationCampaignSerializer(campaigns, many=True).data)


class MyCampaignsView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedHospital]

    @swagger_auto_schema(operation_summary="My hospital campaigns", responses={200: DonationCampaignSerializer(many=True)}, tags=["Hospital Campaigns"])
    def get(self, request):
        campaigns = DonationCampaign.objects.get_for_hospital(request.user.id)
        return Response(DonationCampaignSerializer(campaigns, many=True).data)


class PendingCampaignsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @swagger_auto_schema(operation_summary="Pending campaigns", responses={200: DonationCampaignSerializer(many=True)}, tags=["Campaign Admin"])
    def get(self, _request):
        return Response(DonationCampaignSerializer(DonationCampaign.objects.get_pending(), many=True).data)


class AdminCampaignsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @swagger_auto_schema(operation_summary="All campaigns for admin history", responses={200: DonationCampaignSerializer(many=True)}, tags=["Campaign Admin"])
    def get(self, request):
        status_filter = request.query_params.get("status")
        qs = DonationCampaign.objects.all()
        if status_filter and status_filter.upper() != "ALL":
            qs = qs.filter(status=status_filter.upper())
        return Response(DonationCampaignSerializer(qs, many=True).data)


class CampaignEditView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedHospital]

    @swagger_auto_schema(operation_summary="Edit own pending/rejected campaign", request_body=UpdateCampaignSerializer, responses={200: DonationCampaignSerializer}, tags=["Hospital Campaigns"])
    def patch(self, request, pk):
        campaign = get_object_or_404(DonationCampaign, pk=pk, hospital_user_id=request.user.id)
        if campaign.status not in [DonationCampaign.CampaignStatus.PENDING, DonationCampaign.CampaignStatus.REJECTED]:
            return Response({"detail": "Only campaigns still in review or sent back for edits can be changed."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = UpdateCampaignSerializer(campaign, data=request.data, partial=True, context={"hospital_user_id": request.user.id})
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(campaign, field, value)
        if campaign.status == DonationCampaign.CampaignStatus.REJECTED:
            campaign.status = DonationCampaign.CampaignStatus.PENDING
            campaign.rejection_reason = ""
        campaign.save()
        return Response(DonationCampaignSerializer(campaign).data)


class CampaignReviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @swagger_auto_schema(
        operation_summary="Review campaign",
        request_body=CampaignReviewSerializer,
        responses={200: DonationCampaignSerializer, 400: "Validation error", 404: "Pending campaign not found"},
        tags=["Campaign Admin"],
    )
    def post(self, request, pk):
        serializer = CampaignReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            if serializer.validated_data["action"] == "approve":
                campaign = CampaignService().approve_campaign(pk, request.user.id)
            else:
                campaign = CampaignService().reject_campaign(pk, request.user.id, serializer.validated_data["reason"].strip())
        except DonationCampaign.DoesNotExist:
            return Response({"detail": "We could not find a pending campaign with that ID."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DonationCampaignSerializer(campaign).data)


class CampaignProgressView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedHospital]

    @swagger_auto_schema(operation_summary="Update campaign progress", request_body=CampaignProgressSerializer, responses={200: DonationCampaignSerializer}, tags=["Hospital Campaigns"])
    def patch(self, request, pk):
        campaign = get_object_or_404(DonationCampaign, pk=pk, hospital_user_id=request.user.id)
        serializer = CampaignProgressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            campaign = CampaignService().update_progress(campaign, **serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DonationCampaignSerializer(campaign).data)


class CampaignCancelView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedHospital]

    @swagger_auto_schema(operation_summary="Cancel campaign", request_body=CampaignCancelSerializer, responses={200: DonationCampaignSerializer}, tags=["Hospital Campaigns"])
    def post(self, request, pk):
        campaign = get_object_or_404(DonationCampaign, pk=pk, hospital_user_id=request.user.id)
        serializer = CampaignCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            campaign = CampaignService().cancel_campaign(campaign)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DonationCampaignSerializer(campaign).data)


class CampaignInterestView(APIView):
    permission_classes = [IsAuthenticated, IsDonor]

    @swagger_auto_schema(operation_summary="Register campaign interest", responses={200: "Already interested", 201: "Interest registered"}, tags=["Campaign Interest"])
    def post(self, request, pk):
        campaign = get_object_or_404(DonationCampaign, pk=pk, status__in=["APPROVED", "ONGOING"])
        _interest, created = CampaignService().register_interest(campaign, request.user.id)
        return Response({"created": created, "interested_count": campaign.interested_count}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @swagger_auto_schema(operation_summary="Withdraw campaign interest", responses={200: "Interest withdrawn"}, tags=["Campaign Interest"])
    def delete(self, request, pk):
        campaign = get_object_or_404(DonationCampaign, pk=pk, status__in=["APPROVED", "ONGOING"])
        deleted = CampaignService().withdraw_interest(campaign, request.user.id)
        return Response({"deleted": bool(deleted), "interested_count": campaign.interested_count})
