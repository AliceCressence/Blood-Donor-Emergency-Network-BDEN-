# profiles/serializers.py
from rest_framework import serializers
from .models import DonorProfile


class CreateDonorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DonorProfile
        fields = ["user_id", "first_name", "last_name", "phone", "city", "blood_type"]

    def create(self, validated_data):
        if validated_data.get("blood_type"):
            validated_data["blood_type_status"] = DonorProfile.BloodTypeStatus.VERIFIED
        return super().create(validated_data)


class DonorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DonorProfile
        fields = [
            "id", "user_id", "first_name", "last_name",
            "phone", "city", "blood_type", "blood_type_status",
            "is_available", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user_id", "created_at", "updated_at"]


class UpdateDonorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DonorProfile
        fields = ["first_name", "last_name", "phone", "city", "blood_type", "blood_type_status"]

    def update(self, instance, validated_data):
        if validated_data.get("blood_type") and "blood_type_status" not in validated_data:
            validated_data["blood_type_status"] = DonorProfile.BloodTypeStatus.VERIFIED
        return super().update(instance, validated_data)


class NearbyDonorSerializer(serializers.ModelSerializer):
    """Minimal public-safe representation for nearby donor matching."""
    class Meta:
        model  = DonorProfile
        fields = ["id", "first_name", "city", "blood_type", "blood_type_status", "is_available"]