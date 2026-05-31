# blood_requests/serializers.py
from rest_framework import serializers
from .models import BloodRequest, MatchingResult, RequestResponse


class BloodRequestSerializer(serializers.ModelSerializer):
    responses_count = serializers.SerializerMethodField()

    class Meta:
        model  = BloodRequest
        fields = [
            "id", "hospital_id", "hospital_name", "city",
            "blood_type", "units_needed", "urgency", "status",
            "notes", "latitude", "longitude", "created_at", "expires_at",
            "fulfilled_at", "cancelled_at", "cancellation_reason",
            "responses_count",
        ]
        read_only_fields = ["id", "status", "created_at", "fulfilled_at", "cancelled_at"]

    def get_responses_count(self, obj):
        return obj.responses.filter(status="ACCEPTED").count()


class CreateBloodRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BloodRequest
        fields = [
            "hospital_id", "hospital_name", "city",
            "blood_type", "units_needed", "urgency", "notes", "latitude",
            "longitude", "expires_at",
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


class UpdateBloodRequestSerializer(CreateBloodRequestSerializer):
    class Meta(CreateBloodRequestSerializer.Meta):
        fields = CreateBloodRequestSerializer.Meta.fields
        extra_kwargs = {field: {"required": False} for field in fields}


class RequestResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RequestResponse
        fields = [
            "id", "request", "donor_id", "status", "donor_name",
            "donor_blood_type", "donor_phone", "distance_km", "responded_at",
        ]
        read_only_fields = ["id", "responded_at"]


class DonorRespondSerializer(serializers.Serializer):
    donor_id = serializers.UUIDField(required=False)
    status = serializers.ChoiceField(
        choices=["ACCEPTED", "DECLINED", "UNAVAILABLE", "NO_RESPONSE"],
        required=False,
    )
    response_status = serializers.ChoiceField(
        choices=["ACCEPTED", "DECLINED", "UNAVAILABLE", "NO_RESPONSE"],
        required=False,
    )

    def validate(self, attrs):
        attrs["status"] = attrs.get("response_status") or attrs.get("status")
        if not attrs["status"]:
            raise serializers.ValidationError({"status": "This field is required."})
        return attrs


class BulkRequestResponseSerializer(serializers.Serializer):
    donors = serializers.ListField(child=serializers.DictField(), min_length=1)


class CancelRequestSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class MatchingResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchingResult
        fields = [
            "id", "request", "donor_id", "distance_km",
            "compatibility_score", "created_at",
        ]
