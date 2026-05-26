from drf_yasg.utils import swagger_auto_schema
from geopy.distance import geodesic
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from donors.models import DonorProfile, ScreeningCenter
from donors.serializers import ScreeningCenterSerializer
from .models import BloodTypeEstimationSession
from .serializers import ChatMessageSerializer, ChatResponseSerializer, EstimationSessionSerializer
from .services import GeminiChatService


class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        tags=["Blood Type Estimation"],
        request_body=ChatMessageSerializer,
        responses={200: ChatResponseSerializer},
        operation_description="Send a message to the Gemini-ready blood type estimation chatbot. MVP uses deterministic stub responses.",
    )
    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            profile = DonorProfile.objects.get_by_user_id(request.user.user_id)
        except DonorProfile.DoesNotExist:
            return Response({"detail": "Donor profile not found."}, status=status.HTTP_404_NOT_FOUND)
        if profile.blood_type_verified:
            return Response({"detail": "Your blood type is already verified. No estimation needed.", "blood_type": profile.blood_type}, status=status.HTTP_400_BAD_REQUEST)
        service = GeminiChatService()
        session = service.get_or_create_active_session(profile)
        try:
            result = service.send_message(session, serializer.validated_data["message"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        nearby_centers = []
        if result["session_complete"] and profile.has_location():
            centers_with_dist = []
            for center in ScreeningCenter.objects.filter(is_active=True):
                center._distance_km = round(geodesic((profile.latitude, profile.longitude), (center.latitude, center.longitude)).km, 2)
                centers_with_dist.append(center)
            centers_with_dist.sort(key=lambda center: center._distance_km)
            nearby_centers = ScreeningCenterSerializer(centers_with_dist[:3], many=True).data
        return Response({**result, "screening_centers": nearby_centers})


class EstimationSessionView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(tags=["Blood Type Estimation"], responses={200: EstimationSessionSerializer})
    def get(self, request):
        try:
            profile = DonorProfile.objects.get_by_user_id(request.user.user_id)
        except DonorProfile.DoesNotExist:
            return Response({"detail": "Donor profile not found."}, status=status.HTTP_404_NOT_FOUND)
        session = BloodTypeEstimationSession.objects.filter(donor_profile=profile).order_by("-created_at").first()
        if not session:
            return Response({"detail": "No estimation session found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(EstimationSessionSerializer(session).data)
