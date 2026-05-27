from rest_framework import serializers

from .models import AvailabilityStatus, BloodType, DonationRecord, DonorProfile, Gender, ScreeningCenter


class DonorProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_eligible_to_donate = serializers.SerializerMethodField()
    days_until_eligible = serializers.SerializerMethodField()
    next_eligible_date = serializers.SerializerMethodField()

    class Meta:
        model = DonorProfile
        fields = [
            "id", "user_id", "first_name", "last_name", "full_name", "gender", "phone", "date_of_birth",
            "blood_type", "blood_type_verified", "blood_type_estimated", "latitude", "longitude",
            "city", "region", "availability_status", "last_donation_date", "total_donations",
            "total_volume_ml", "is_eligible_to_donate", "days_until_eligible", "next_eligible_date",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_is_eligible_to_donate(self, obj):
        return obj.is_eligible_to_donate()

    def get_days_until_eligible(self, obj):
        return obj.days_until_eligible()

    def get_next_eligible_date(self, obj):
        return obj.get_next_eligible_date()


class UpdateProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=False)
    last_name = serializers.CharField(max_length=100, required=False)
    gender = serializers.ChoiceField(choices=Gender.choices, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    latitude = serializers.FloatField(required=False, allow_null=True, min_value=-90, max_value=90)
    longitude = serializers.FloatField(required=False, allow_null=True, min_value=-180, max_value=180)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    region = serializers.CharField(max_length=100, required=False, allow_blank=True)
    availability_status = serializers.ChoiceField(choices=AvailabilityStatus.choices, required=False)

    def validate(self, attrs):
        if ("latitude" in attrs) != ("longitude" in attrs):
            raise serializers.ValidationError("Latitude and longitude must be provided together.")
        return attrs


class UpdateBloodTypeSerializer(serializers.Serializer):
    blood_type = serializers.ChoiceField(choices=[choice for choice in BloodType.choices if choice[0] != BloodType.UNKNOWN])
    verified = serializers.BooleanField(default=False)


class DonationRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationRecord
        fields = ["id", "source_type", "source_id", "facility_name", "volume_ml", "donation_date", "notes", "created_at"]


class RecordDonationSerializer(serializers.Serializer):
    donor_user_id = serializers.UUIDField()
    source_type = serializers.ChoiceField(choices=DonationRecord.SourceType.choices)
    source_id = serializers.UUIDField(required=False, allow_null=True)
    facility_name = serializers.CharField(max_length=255)
    facility_user_id = serializers.UUIDField(required=False, allow_null=True)
    volume_ml = serializers.IntegerField(min_value=350)
    donation_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)


class VirtualDonorCardSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    card_number = serializers.CharField()
    donor_name = serializers.SerializerMethodField()
    blood_type = serializers.CharField()
    total_donations = serializers.IntegerField()
    total_volume_ml = serializers.IntegerField()
    last_donation_date = serializers.DateField(allow_null=True)
    next_eligible_date = serializers.DateField(allow_null=True)
    is_eligible_now = serializers.BooleanField()
    is_regular_donor = serializers.BooleanField()
    issued_at = serializers.DateTimeField()

    def get_donor_name(self, obj):
        return obj.donor_profile.get_full_name()


class NearbyDonorSerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = DonorProfile
        fields = ["user_id", "blood_type", "city", "distance_km", "availability_status"]

    def get_distance_km(self, obj):
        return getattr(obj, "_distance_km", None)


class ScreeningCenterSerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = ScreeningCenter
        fields = "__all__"

    def get_distance_km(self, obj):
        return getattr(obj, "_distance_km", None)
