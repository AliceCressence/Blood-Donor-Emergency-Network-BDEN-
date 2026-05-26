from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import HospitalRegistration, User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        token["is_verified"] = user.is_verified
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if user.is_hospital() and not user.is_verified:
            raise serializers.ValidationError(
                {
                    "detail": "Your hospital account is pending administrator verification.",
                    "code": "hospital_pending_verification",
                }
            )
        data["user"] = {
            "id": str(user.id),
            "email": user.email,
            "role": user.role.lower(),
            "isVerified": user.is_verified,
        }
        data["user_id"] = str(user.id)
        data["role"] = user.role
        data["email"] = user.email
        data["is_verified"] = user.is_verified
        return data


class DonorRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    city = serializers.CharField(max_length=100)
    blood_type = serializers.CharField(max_length=3, required=False, allow_blank=True, default="")

    def validate_email(self, value):
        normalized = value.lower().strip()
        if User.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized

    def validate_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError("Password cannot consist entirely of numbers.")
        return value


class HospitalRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    facility_name = serializers.CharField(max_length=255)
    facility_type = serializers.ChoiceField(choices=HospitalRegistration.FacilityType.choices)
    registration_number = serializers.CharField(max_length=100)
    address = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    city = serializers.CharField(max_length=100)
    region = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")

    def validate_email(self, value):
        normalized = value.lower().strip()
        if User.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized

    def validate_registration_number(self, value):
        normalized = value.strip()
        if HospitalRegistration.objects.filter(registration_number=normalized).exists():
            raise serializers.ValidationError("A facility with this registration number is already registered.")
        return normalized


class GoogleAuthSerializer(serializers.Serializer):
    code = serializers.CharField()
    redirect_uri = serializers.CharField(required=False, allow_blank=True)


class HospitalRegistrationDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_id = serializers.UUIDField(source="user.id", read_only=True)

    class Meta:
        model = HospitalRegistration
        fields = [
            "id",
            "user_id",
            "user_email",
            "facility_name",
            "facility_type",
            "registration_number",
            "address",
            "city",
            "region",
            "contact_phone",
            "verification_status",
            "rejection_reason",
            "submitted_at",
            "reviewed_at",
        ]
        read_only_fields = fields


class AdminVerificationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])
    reason = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate(self, attrs):
        if attrs["action"] == "reject" and not attrs.get("reason", "").strip():
            raise serializers.ValidationError({"reason": "A reason must be provided when rejecting a registration."})
        return attrs
