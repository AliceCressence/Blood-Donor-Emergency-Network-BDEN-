from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DonorProfile
from .serializers import CreateDonorProfileSerializer


class CreateDonorProfileView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if request.headers.get("X-Internal-API-Key") != settings.INTERNAL_API_KEY:
            return Response({"detail": "Invalid internal API key."}, status=status.HTTP_403_FORBIDDEN)

        existing = DonorProfile.objects.filter(user_id=request.data.get("user_id")).first()
        if existing:
            return Response({"id": str(existing.id), "created": False}, status=status.HTTP_200_OK)

        serializer = CreateDonorProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response({"id": str(profile.id), "created": True}, status=status.HTTP_201_CREATED)
