# blood_requests/views.py
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BloodRequest, RequestResponse
from .serializers import (
    BulkRequestResponseSerializer,
    BloodRequestSerializer,
    CancelRequestSerializer,
    CreateBloodRequestSerializer,
    DonorRespondSerializer,
    RequestResponseSerializer,
)
from .services import cancel_request, create_request, record_donor_response


def verify_internal_key(request):
    """Check X-Internal-API-Key header."""
    return request.headers.get("X-Internal-API-Key") == settings.INTERNAL_API_KEY


# ── POST /api/requests/  — hospital creates a request ─────────
class CreateBloodRequestView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = CreateBloodRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        blood_request = create_request(serializer.validated_data)

        return Response(
            BloodRequestSerializer(blood_request).data,
            status=status.HTTP_201_CREATED
        )


# ── GET /api/requests/  — list active requests ─────────────────
class ListBloodRequestsView(APIView):
    permission_classes = []

    def get(self, request):
        city       = request.query_params.get("city")
        blood_type = request.query_params.get("blood_type")
        req_status = request.query_params.get("status", "ACTIVE")

        active_statuses = ["ACTIVE", "OPEN", "PARTIALLY_FULFILLED", "MATCHED"]
        qs = BloodRequest.objects.filter(status__in=active_statuses) if req_status in ["ACTIVE", "OPEN"] else BloodRequest.objects.filter(status=req_status)

        if city:
            qs = qs.filter(city__icontains=city)
        if blood_type:
            qs = qs.filter(blood_type=blood_type)

        serializer = BloodRequestSerializer(qs, many=True)
        return Response(serializer.data)


# ── GET /api/requests/<id>/  — single request detail ──────────
class BloodRequestDetailView(APIView):
    permission_classes = []

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
    permission_classes = []

    def post(self, request, pk):
        try:
            blood_request = BloodRequest.objects.get(
                pk=pk,
                status__in=["ACTIVE", "OPEN", "PARTIALLY_FULFILLED", "MATCHED"],
            )
        except BloodRequest.DoesNotExist:
            return Response(
                {"detail": "Active request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = DonorRespondSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        donor_id = serializer.validated_data.get("donor_id") or getattr(request.user, "id", None)
        if not donor_id:
            return Response(
                {"detail": "donor_id is required when no JWT user is available."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        resp_status = serializer.validated_data["status"]

        response_obj, created = record_donor_response(
            blood_request=blood_request,
            donor_id=donor_id,
            response_status=resp_status,
            donor_data=request.data,
        )

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
    permission_classes = []

    def put(self, request, pk):
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

        if new_status == "CANCELLED":
            blood_request = cancel_request(blood_request, request.data.get("reason", ""))
        else:
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


class MyHospitalRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = BloodRequest.objects.filter(hospital_id=request.user.id)
        serializer = BloodRequestSerializer(qs, many=True)
        return Response(serializer.data)


class CancelBloodRequestView(APIView):
    permission_classes = []

    def post(self, request, pk):
        try:
            blood_request = BloodRequest.objects.get(pk=pk)
        except BloodRequest.DoesNotExist:
            return Response(
                {"detail": "Request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CancelRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        blood_request = cancel_request(blood_request, serializer.validated_data["reason"])
        return Response(BloodRequestSerializer(blood_request).data)


class RequestResponsesView(APIView):
    permission_classes = []

    def get(self, request, pk):
        qs = RequestResponse.objects.filter(request_id=pk)
        return Response(RequestResponseSerializer(qs, many=True).data)


class BulkRequestResponsesView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, pk):
        if not verify_internal_key(request):
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            blood_request = BloodRequest.objects.get(pk=pk)
        except BloodRequest.DoesNotExist:
            return Response(
                {"detail": "Request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BulkRequestResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = 0
        for donor in serializer.validated_data["donors"]:
            response_obj, was_created = RequestResponse.objects.update_or_create(
                request=blood_request,
                donor_id=donor["donor_id"],
                defaults={
                    "status": donor.get("status", "PENDING"),
                    "donor_name": donor.get("name", ""),
                    "donor_blood_type": donor.get("blood_type", ""),
                    "donor_phone": donor.get("phone", ""),
                    "distance_km": donor.get("distance_km"),
                },
            )
            created += int(was_created)
        return Response({"created": created, "total": len(serializer.validated_data["donors"])})
