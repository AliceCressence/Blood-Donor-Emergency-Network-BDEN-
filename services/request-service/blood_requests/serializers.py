# blood_requests/serializers.py
from rest_framework import serializers
from .models import BloodRequest, RequestResponse


class BloodRequestSerializer(serializers.ModelSerializer):
    responses_count = serializers.SerializerMethodField()

    class Meta:
        model  = BloodRequest
        fields = [
            "id", "hospital_id", "hospital_name", "city",
            "blood_type", "units_needed", "urgency", "status",
            "notes", "created_at", "expires_at", "fulfilled_at",
            "responses_count",
        ]
        read_only_fields = ["id", "status", "created_at", "fulfilled_at"]

    def get_responses_count(self, obj):
        return obj.responses.filter(status="ACCEPTED").count()


class CreateBloodRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BloodRequest
        fields = [
            "hospital_id", "hospital_name", "city",
            "blood_type", "units_needed", "urgency", "notes", "expires_at",
        ]

    def validate_blood_type(self, value):
        valid = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        if value not in valid:
            raise serializers.ValidationError(
                f"Invalid blood type. Must be one of: {', '.join(valid)}"
            )
        return value

    def validate_units_needed(self, value):
        if value < 1 or value > 20:
            raise serializers.ValidationError("Units needed must be between 1 and 20.")
        return value


class RequestResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RequestResponse
        fields = ["id", "request", "donor_id", "status", "responded_at"]
        read_only_fields = ["id", "responded_at"]


class DonorRespondSerializer(serializers.Serializer):
    donor_id = serializers.UUIDField()
    status   = serializers.ChoiceField(
                 choices=["ACCEPTED", "DECLINED", "UNAVAILABLE"]
               )