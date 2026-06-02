from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from campaigns.permissions import IsAdmin
from .models import DonorDashboardBanner
from .serializers import (
    CreateDonorDashboardBannerSerializer,
    DonorDashboardBannerSerializer,
    UpdateDonorDashboardBannerSerializer,
)


class ActiveDonorBannerView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(operation_summary="Active donor dashboard banner", responses={200: DonorDashboardBannerSerializer})
    def get(self, _request):
        banner = DonorDashboardBanner.objects.filter(is_active=True).order_by("-updated_at").first()
        if not banner:
            return Response(None)
        return Response(DonorDashboardBannerSerializer(banner).data)


class AdminDonorBannerListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @swagger_auto_schema(operation_summary="List donor dashboard banners", responses={200: DonorDashboardBannerSerializer(many=True)})
    def get(self, _request):
        return Response(DonorDashboardBannerSerializer(DonorDashboardBanner.objects.all(), many=True).data)

    @swagger_auto_schema(operation_summary="Create donor dashboard banner", request_body=CreateDonorDashboardBannerSerializer, responses={201: DonorDashboardBannerSerializer})
    def post(self, request):
        serializer = CreateDonorDashboardBannerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            if serializer.validated_data.get("is_active", True):
                DonorDashboardBanner.objects.update(is_active=False)
            banner = DonorDashboardBanner.objects.create(created_by=request.user.id, **serializer.validated_data)
        return Response(DonorDashboardBannerSerializer(banner).data, status=status.HTTP_201_CREATED)


class AdminDonorBannerDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @swagger_auto_schema(operation_summary="Update donor dashboard banner", request_body=UpdateDonorDashboardBannerSerializer, responses={200: DonorDashboardBannerSerializer})
    def patch(self, request, pk):
        banner = get_object_or_404(DonorDashboardBanner, pk=pk)
        serializer = UpdateDonorDashboardBannerSerializer(banner, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            if serializer.validated_data.get("is_active"):
                DonorDashboardBanner.objects.exclude(pk=banner.pk).update(is_active=False)
            serializer.save()
        return Response(DonorDashboardBannerSerializer(banner).data)
