import logging

import requests as http_requests
from django.conf import settings
from django.db import transaction

from accounts.models import HospitalRegistration, User
from .events import publish_event

logger = logging.getLogger(__name__)


class DonorRegistrationService:
    @transaction.atomic
    def register(self, validated_data: dict) -> User:
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            role=User.Role.DONOR,
            is_verified=True,
            gender=validated_data.get("gender", ""),
        )
        success = self._create_donor_profile(
            user_id=str(user.id),
            first_name=validated_data["first_name"],
            last_name=validated_data.get("last_name", ""),
            phone=validated_data.get("phone", ""),
            city=validated_data["city"],
            blood_type=validated_data.get("blood_type", ""),
            gender=validated_data.get("gender", ""),
        )
        if not success:
            raise RuntimeError("Donor profile creation failed.")
        return user

    def _create_donor_profile(self, user_id: str, first_name: str, last_name: str, phone: str, city: str, blood_type: str = "", gender: str = "") -> bool:
        url = f"{settings.DONOR_SERVICE_INTERNAL_URL}/internal/donors/create-profile/"
        try:
            response = http_requests.post(
                url,
                json={
                    "user_id": user_id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "phone": phone,
                    "city": city,
                    "blood_type": blood_type,
                    "gender": gender,
                },
                headers={"X-Internal-API-Key": settings.INTERNAL_API_KEY, "Content-Type": "application/json"},
                timeout=10,
            )
            return response.status_code in (200, 201)
        except http_requests.RequestException as exc:
            logger.error("Error calling donor-service: %s", exc)
            return False

    def get_profile_status(self, user_id: str) -> dict:
        url = f"{settings.DONOR_SERVICE_INTERNAL_URL}/internal/donors/profile-status/"
        try:
            response = http_requests.get(
                url,
                params={"user_id": user_id},
                headers={"X-Internal-API-Key": settings.INTERNAL_API_KEY},
                timeout=10,
            )
            if response.status_code == 200:
                return response.json()
        except http_requests.RequestException as exc:
            logger.error("Error checking donor profile status: %s", exc)
        return {"profile_complete": False}


class HospitalRegistrationService:
    @transaction.atomic
    def register(self, validated_data: dict) -> User:
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            role=User.Role.HOSPITAL,
            is_verified=False,
        )
        HospitalRegistration.objects.create(
            user=user,
            facility_name=validated_data["facility_name"],
            facility_type=validated_data["facility_type"],
            registration_number=validated_data["registration_number"],
            address=validated_data.get("address", ""),
            city=validated_data["city"],
            region=validated_data.get("region", ""),
            contact_phone=validated_data.get("contact_phone", ""),
        )
        publish_event(
            "HOSPITAL_REGISTRATION_SUBMITTED",
            {
                "hospital_user_id": str(user.id),
                "facility_name": validated_data["facility_name"],
                "email": validated_data["email"],
                "city": validated_data["city"],
            },
        )
        return user


class GoogleAuthService:
    def authenticate(self, code: str, redirect_uri: str = None) -> tuple[User, bool]:
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise ValueError("Google OAuth is not configured.")
        tokens = self._exchange_code(code, redirect_uri)
        google_info = self._get_user_info(tokens["access_token"])
        if not google_info.get("email_verified", True):
            raise ValueError("Google email is not verified.")

        google_id = google_info["sub"]
        email = google_info["email"].lower()
        user = self._find_existing_user(google_id, email, tokens["access_token"])
        if user:
            if user.role != User.Role.DONOR:
                raise ValueError("Only donor accounts can use Google OAuth.")
            return user, False

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                role=User.Role.DONOR,
                is_verified=True,
                google_id=google_id,
                google_access_token=tokens["access_token"],
            )
            DonorRegistrationService()._create_donor_profile(
                user_id=str(user.id),
                first_name=google_info.get("given_name", ""),
                last_name=google_info.get("family_name", ""),
                phone="",
                city="",
            )
        return user, True

    def _find_existing_user(self, google_id: str, email: str, access_token: str) -> User | None:
        for lookup in ({"google_id": google_id}, {"email": email}):
            try:
                user = User.objects.get(**lookup)
                user.google_id = google_id
                user.google_access_token = access_token
                user.save(update_fields=["google_id", "google_access_token"])
                return user
            except User.DoesNotExist:
                continue
        return None

    def _exchange_code(self, code: str, redirect_uri: str) -> dict:
        response = http_requests.post(
            settings.GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri or settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
        if response.status_code != 200:
            raise ValueError("Google token exchange failed.")
        return response.json()

    def _get_user_info(self, access_token: str) -> dict:
        response = http_requests.get(settings.GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
        if response.status_code != 200:
            raise ValueError("Google user info lookup failed.")
        return response.json()


class AdminVerificationService:
    @transaction.atomic
    def verify(self, hospital_user_id, admin_user, action: str, reason: str = "") -> HospitalRegistration:
        registration = HospitalRegistration.objects.select_for_update().get(user_id=hospital_user_id)
        if registration.verification_status != HospitalRegistration.VerificationStatus.PENDING:
            raise ValueError("No pending registration exists for this hospital.")

        if action == "approve":
            registration.approve(admin_user)
            publish_event("HOSPITAL_VERIFIED", {"hospital_user_id": str(hospital_user_id), "facility_name": registration.facility_name})
        else:
            registration.reject(admin_user, reason)
            publish_event("HOSPITAL_REJECTED", {"hospital_user_id": str(hospital_user_id), "facility_name": registration.facility_name, "reason": reason})
        return registration
