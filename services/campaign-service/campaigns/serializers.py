from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import DonationCampaign, VALID_BLOOD_TYPES


class DonationCampaignSerializer(serializers.ModelSerializer):
    donor_progress_pct = serializers.SerializerMethodField()
    volume_progress_pct = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = DonationCampaign
        fields = [
            "id",
            "hospital_user_id",
            "hospital_name",
            "hospital_email",
            "title",
            "description",
            "blood_types_needed",
            "target_donors",
            "target_volume_ml",
            "donor_incentives",
            "start_datetime",
            "end_datetime",
            "latitude",
            "longitude",
            "city",
            "address",
            "status",
            "rejection_reason",
            "approved_by",
            "approved_at",
            "actual_donors",
            "actual_volume_ml",
            "interested_count",
            "donor_progress_pct",
            "volume_progress_pct",
            "distance_km",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "hospital_user_id",
            "status",
            "rejection_reason",
            "approved_by",
            "approved_at",
            "actual_donors",
            "actual_volume_ml",
            "interested_count",
            "created_at",
            "updated_at",
        ]

    def get_donor_progress_pct(self, obj):
        return obj.get_donor_progress_pct()

    def get_volume_progress_pct(self, obj):
        return obj.get_volume_progress_pct()

    def get_distance_km(self, obj):
        return getattr(obj, "_distance_km", None)


class CreateCampaignSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(max_length=255)
    hospital_email = serializers.EmailField(required=False, allow_blank=True)
    blood_types_needed = serializers.ListField(child=serializers.ChoiceField(choices=sorted(VALID_BLOOD_TYPES)), required=False, allow_empty=True)

    class Meta:
        model = DonationCampaign
        fields = [
            "hospital_name",
            "hospital_email",
            "title",
            "description",
            "blood_types_needed",
            "target_donors",
            "target_volume_ml",
            "donor_incentives",
            "start_datetime",
            "end_datetime",
            "latitude",
            "longitude",
            "city",
            "address",
        ]

    def validate(self, attrs):
        attrs.setdefault("blood_types_needed", [])
        campaign = DonationCampaign(**attrs, hospital_user_id=self.context["hospital_user_id"])
        try:
            campaign.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)
        return attrs


class UpdateCampaignSerializer(CreateCampaignSerializer):
    class Meta(CreateCampaignSerializer.Meta):
        extra_kwargs = {
            "hospital_name": {"required": False},
            "title": {"required": False},
            "description": {"required": False},
            "start_datetime": {"required": False},
            "end_datetime": {"required": False},
            "latitude": {"required": False},
            "longitude": {"required": False},
            "city": {"required": False},
        }

    def validate(self, attrs):
        merged = {
            field.name: getattr(self.instance, field.name)
            for field in DonationCampaign._meta.fields
            if hasattr(self.instance, field.name)
        } if self.instance else {}
        merged.update(attrs)
        merged.setdefault("blood_types_needed", [])
        campaign = DonationCampaign(**merged)
        campaign._state.adding = False
        try:
            campaign.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)
        return attrs


class CampaignReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate(self, attrs):
        if attrs["action"] == "reject" and not attrs.get("reason", "").strip():
            raise serializers.ValidationError({"reason": "Please add a reason before rejecting this campaign."})
        return attrs


class CampaignProgressSerializer(serializers.Serializer):
    actual_donors = serializers.IntegerField(min_value=0)
    actual_volume_ml = serializers.IntegerField(min_value=0)


class CampaignCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)
