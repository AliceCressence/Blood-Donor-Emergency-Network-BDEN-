from rest_framework import serializers

from .models import DonorProfile


class CreateDonorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorProfile
        fields = ["user_id", "first_name", "last_name", "phone", "city", "blood_type"]

    def create(self, validated_data):
        if validated_data.get("blood_type"):
            validated_data["blood_type_status"] = DonorProfile.BloodTypeStatus.VERIFIED
        return super().create(validated_data)
