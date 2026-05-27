from urllib.parse import urlencode

from django.conf import settings
from django.utils.decorators import method_decorator
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView as BaseTokenRefreshView

from accounts.models import HospitalRegistration, User
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
        "gender": user.gender,
        "authProvider": user.auth_provider,
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
    """
    Register an individual donor and issue JWT tokens immediately.

    The auth service also creates the donor's profile through donor-service's
    internal create-profile endpoint. If donor profile creation fails, the
    user creation transaction is rolled back.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Register donor",
        operation_description=(
            "Creates a DONOR account, creates the matching donor profile in donor-service, "
            "and returns access/refresh JWT tokens for immediate login."
        ),
        request_body=DonorRegistrationSerializer,
        responses={201: "Donor registered with JWT tokens", 400: "Validation error", 500: "Profile creation rollback"},
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = DonorRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = DonorRegistrationService().register(serializer.validated_data)
        return token_response(user, "Registration successful. Welcome to BDEN.", status.HTTP_201_CREATED, profile_complete=False)


class HospitalRegisterView(APIView):
    """
    Register a health facility for administrator review.

    Hospital accounts are created with is_verified=False and cannot log in
    until an admin approves the registration.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Register hospital",
        operation_description=(
            "Creates an unverified HOSPITAL account and a pending HospitalRegistration. "
            "No JWT token is issued until admin approval."
        ),
        request_body=HospitalRegistrationSerializer,
        responses={201: "Hospital registration submitted", 400: "Validation error"},
        tags=["Authentication"],
    )
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


@method_decorator(
    name="post",
    decorator=swagger_auto_schema(
        operation_summary="Login",
        operation_description="Authenticate by email and password. Unverified hospitals are blocked.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["email", "password"],
            properties={
                "email": openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL),
                "password": openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_PASSWORD),
            },
        ),
        responses={200: "JWT access and refresh tokens", 400: "Invalid credentials or unverified hospital"},
        tags=["Authentication"],
    ),
)
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """Blacklist a refresh token and end the current session."""
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Logout",
        operation_description="Blacklists the supplied refresh token. The frontend should also clear local session storage.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["refresh"],
            properties={"refresh": openapi.Schema(type=openapi.TYPE_STRING)},
        ),
        responses={200: "Logged out", 400: "Missing or invalid refresh token"},
        tags=["Authentication"],
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
            return Response({"message": "You have been logged out successfully."})
        except TokenError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(
    name="post",
    decorator=swagger_auto_schema(
        operation_summary="Refresh access token",
        operation_description="Exchange a valid refresh token for a fresh access token.",
        tags=["Authentication"],
    ),
)
class TokenRefreshView(BaseTokenRefreshView):
    permission_classes = [AllowAny]


class GoogleAuthInitView(APIView):
    """Return the Google authorization URL used by the frontend redirect."""
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Start Google OAuth",
        operation_description=(
            "Returns Google's authorization URL. The frontend redirects the browser to this URL. "
            "Google redirects back to the configured frontend callback URL with a code."
        ),
        responses={200: "Authorization URL"},
        tags=["Google OAuth"],
    )
    def get(self, _request):
        redirect_uri = settings.GOOGLE_AUTH_FRONTEND_CALLBACK_URL or settings.GOOGLE_REDIRECT_URI
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        return Response({"authorization_url": f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"})


class GoogleAuthCallbackView(APIView):
    """Exchange a Google authorization code for a BDEN donor session."""
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Complete Google OAuth",
        operation_description=(
            "Receives the Google authorization code from the frontend callback page, exchanges it with Google, "
            "creates or links a donor account, and returns BDEN JWT tokens."
        ),
        request_body=GoogleAuthSerializer,
        responses={200: "Google authenticated with JWT tokens", 400: "OAuth validation error"},
        tags=["Google OAuth"],
    )
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
        profile_status = DonorRegistrationService().get_profile_status(str(user.id))
        return token_response(
            user,
            "Google authentication successful.",
            is_new_user=is_new,
            profile_complete=profile_status.get("profile_complete", False),
            name=f"{profile_status.get('first_name', '')} {profile_status.get('last_name', '')}".strip(),
            phone=profile_status.get("phone", ""),
            city=profile_status.get("city", ""),
            bloodType=profile_status.get("blood_type", ""),
        )


class MeView(APIView):
    """Return the currently authenticated user's minimal session profile."""
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Current user",
        operation_description="Returns the user represented by the supplied Bearer access token.",
        responses={200: "Current user"},
        tags=["Authentication"],
    )
    def get(self, request):
        return Response({"user": user_payload(request.user)})

    @swagger_auto_schema(
        operation_summary="Update current user",
        operation_description="Updates account-level profile metadata owned by auth-service. Email is intentionally not editable.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "gender": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=[choice[0] for choice in User.Gender.choices],
                    description="Optional user gender value used for profile completion.",
                ),
            },
        ),
        responses={200: "Updated current user"},
        tags=["Authentication"],
    )
    def patch(self, request):
        gender = request.data.get("gender")
        if gender is not None:
            if gender and gender not in User.Gender.values:
                return Response({"gender": "Unsupported gender value."}, status=status.HTTP_400_BAD_REQUEST)
            request.user.gender = gender
            request.user.save(update_fields=["gender", "updated_at"])
        return Response({"user": user_payload(request.user)})


class PendingHospitalsView(APIView):
    """List hospital registrations awaiting administrator review."""
    permission_classes = [IsAuthenticated, IsAdmin]

    @swagger_auto_schema(
        operation_summary="List pending hospitals",
        operation_description="Admin-only endpoint returning hospital registrations with PENDING verification status.",
        responses={200: HospitalRegistrationDetailSerializer(many=True)},
        tags=["Admin Verification"],
    )
    def get(self, _request):
        registrations = HospitalRegistration.objects.filter(
            verification_status=HospitalRegistration.VerificationStatus.PENDING
        ).select_related("user").order_by("submitted_at")
        return Response({"results": HospitalRegistrationDetailSerializer(registrations, many=True).data})


class HospitalVerificationView(APIView):
    """Approve or reject a pending hospital registration."""
    permission_classes = [IsAuthenticated, IsAdmin]

    @swagger_auto_schema(
        operation_summary="Verify hospital",
        operation_description="Admin-only endpoint to approve or reject a pending hospital registration. Rejections require a reason.",
        request_body=AdminVerificationSerializer,
        responses={200: HospitalRegistrationDetailSerializer, 400: "Invalid action or no pending registration"},
        tags=["Admin Verification"],
    )
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
