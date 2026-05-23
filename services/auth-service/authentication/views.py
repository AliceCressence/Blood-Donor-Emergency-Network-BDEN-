from urllib.parse import urlencode

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView as BaseTokenRefreshView

from accounts.models import HospitalRegistration
from .permissions import IsAdmin
from .serializers import (
    AdminVerificationSerializer,
    CustomTokenObtainPairSerializer,
    DonorRegistrationSerializer,
    GoogleAuthSerializer,
    HospitalRegistrationDetailSerializer,
    HospitalRegistrationSerializer,
)
from .services import AdminVerificationService, DonorRegistrationService, GoogleAuthService, HospitalRegistrationService


def user_payload(user, **extra):
    payload = {
        "id": str(user.id),
        "email": user.email,
        "role": user.role.lower(),
        "isVerified": user.is_verified,
    }
    payload.update(extra)
    return payload


def token_response(user, message, status_code=status.HTTP_200_OK, **extra):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["email"] = user.email
    refresh["is_verified"] = user.is_verified
    return Response(
        {
            "message": message,
            "user": user_payload(user, **extra),
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            **extra,
        },
        status=status_code,
    )


class DonorRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DonorRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = DonorRegistrationService().register(serializer.validated_data)
        return token_response(user, "Registration successful. Welcome to BDEN.", status.HTTP_201_CREATED, profile_complete=False)


class HospitalRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = HospitalRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        HospitalRegistrationService().register(serializer.validated_data)
        return Response(
            {
                "message": "Your hospital registration has been submitted successfully.",
                "status": HospitalRegistration.VerificationStatus.PENDING,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
            return Response({"message": "You have been logged out successfully."})
        except TokenError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class TokenRefreshView(BaseTokenRefreshView):
    permission_classes = [AllowAny]


class GoogleAuthInitView(APIView):
    permission_classes = [AllowAny]

    def get(self, _request):
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        return Response({"authorization_url": f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"})


class GoogleAuthCallbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user, is_new = GoogleAuthService().authenticate(
                serializer.validated_data["code"],
                serializer.validated_data.get("redirect_uri"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return token_response(user, "Google authentication successful.", is_new_user=is_new, profile_complete=not is_new)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": user_payload(request.user)})


class PendingHospitalsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, _request):
        registrations = HospitalRegistration.objects.filter(
            verification_status=HospitalRegistration.VerificationStatus.PENDING
        ).select_related("user").order_by("submitted_at")
        return Response({"results": HospitalRegistrationDetailSerializer(registrations, many=True).data})


class HospitalVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        serializer = AdminVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            registration = AdminVerificationService().verify(
                hospital_user_id=user_id,
                admin_user=request.user,
                action=serializer.validated_data["action"],
                reason=serializer.validated_data.get("reason", ""),
            )
        except (HospitalRegistration.DoesNotExist, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(HospitalRegistrationDetailSerializer(registration).data)
