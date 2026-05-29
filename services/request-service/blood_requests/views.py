# blood_requests/views.py
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BloodRequest, RequestResponse
from .serializers import (
    BloodRequestSerializer,
    CreateBloodRequestSerializer,
    DonorRespondSerializer,
)


def verify_internal_key(request):
    """Check X-Internal-API-Key header."""
    return request.headers.get("X-Internal-API-Key") == settings.INTERNAL_API_KEY


# ── POST /api/requests/  — hospital creates a request ─────────
class CreateBloodRequestView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        if not verify_internal_key(request):
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreateBloodRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        blood_request = serializer.save()

        return Response(
            BloodRequestSerializer(blood_request).data,
            status=status.HTTP_201_CREATED
        )


# ── GET /api/requests/  — list active requests ─────────────────
class ListBloodRequestsView(APIView):
    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        city       = request.query_params.get("city")
        blood_type = request.query_params.get("blood_type")
        req_status = request.query_params.get("status", "ACTIVE")

        qs = BloodRequest.objects.filter(status=req_status)

        if city:
            qs = qs.filter(city__icontains=city)
        if blood_type:
            qs = qs.filter(blood_type=blood_type)

        serializer = BloodRequestSerializer(qs, many=True)
        return Response(serializer.data)


# ── GET /api/requests/<id>/  — single request detail ──────────
class BloodRequestDetailView(APIView):
    authentication_classes = []
    permission_classes     = []

    def get(self, request, pk):
        try:
            blood_request = BloodRequest.objects.get(pk=pk)
        except BloodRequest.DoesNotExist:
            return Response(
                {"detail": "Request not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(BloodRequestSerializer(blood_request).data)


# ── POST /api/requests/<id>/respond/  — donor responds ────────
class DonorRespondView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request, pk):
        try:
            blood_request = BloodRequest.objects.get(pk=pk, status="ACTIVE")
        except BloodRequest.DoesNotExist:
            return Response(
                {"detail": "Active request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = DonorRespondSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        donor_id    = serializer.validated_data["donor_id"]
        resp_status = serializer.validated_data["status"]

        response_obj, created = RequestResponse.objects.update_or_create(
            request=blood_request,
            donor_id=donor_id,
            defaults={"status": resp_status},
        )

        # If donor accepted and enough donors responded, mark as matched
        if resp_status == "ACCEPTED":
            accepted_count = blood_request.responses.filter(
                status="ACCEPTED"
            ).count()
            if accepted_count >= blood_request.units_needed:
                blood_request.status = "MATCHED"
                blood_request.save()

        return Response(
            {
                "id":      str(response_obj.id),
                "status":  response_obj.status,
                "created": created,
            },
            status=status.HTTP_200_OK
        )


# ── PUT /api/requests/<id>/close/  — hospital closes ──────────
class CloseBloodRequestView(APIView):
    authentication_classes = []
    permission_classes     = []

    def put(self, request, pk):
        if not verify_internal_key(request):
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            blood_request = BloodRequest.objects.get(pk=pk)
        except BloodRequest.DoesNotExist:
            return Response(
                {"detail": "Request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status", "FULFILLED")
        if new_status not in ["FULFILLED", "CANCELLED", "EXPIRED"]:
            return Response(
                {"detail": "Invalid status. Use FULFILLED, CANCELLED, or EXPIRED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        blood_request.status = new_status
        if new_status == "FULFILLED":
            blood_request.fulfilled_at = timezone.now()
        blood_request.save()

        return Response(BloodRequestSerializer(blood_request).data)


# ── GET /api/requests/hospital/<hospital_id>/  — hospital's own requests
class HospitalRequestsView(APIView):
    authentication_classes = []
    permission_classes     = []

    def get(self, request, hospital_id):
        if not verify_internal_key(request):
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = BloodRequest.objects.filter(hospital_id=hospital_id)
        serializer = BloodRequestSerializer(qs, many=True)
        return Response(serializer.data)