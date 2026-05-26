from django.conf import settings
from django.db import transaction

from .cache import get_cached_nearby, invalidate_nearby_cache_for_city, set_cached_nearby
from .models import AvailabilityStatus, DonationRecord, DonorProfile, VirtualDonorCard


class DonorProfileService:
    @transaction.atomic
    def create_profile(self, user_id, first_name, last_name="", phone="", city="", blood_type=""):
        if DonorProfile.objects.filter(user_id=user_id).exists():
            raise ValueError("Profile already exists for this user.")
        profile = DonorProfile.objects.create(
            user_id=user_id,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            city=city,
            blood_type=blood_type or "UNKNOWN",
            blood_type_verified=bool(blood_type),
        )
        VirtualDonorCard.objects.create(donor_profile=profile)
        return profile

    def get_profile(self, user_id):
        return DonorProfile.objects.get_by_user_id(user_id)

    def update_profile(self, user_id, validated_data):
        permitted = {"first_name", "last_name", "phone", "date_of_birth", "latitude", "longitude", "city", "region", "availability_status"}
        profile = self.get_profile(user_id)
        changed = []
        for key, value in validated_data.items():
            if key in permitted and getattr(profile, key) != value:
                setattr(profile, key, value)
                changed.append(key)
        if changed:
            profile.save(update_fields=[*changed, "updated_at"])
            if "city" in changed or "availability_status" in changed:
                invalidate_nearby_cache_for_city(profile.city)
        return profile

    def update_blood_type(self, user_id, blood_type, verified):
        profile = self.get_profile(user_id)
        profile.blood_type = blood_type
        profile.blood_type_verified = verified
        if verified:
            profile.blood_type_estimated = ""
        profile.save(update_fields=["blood_type", "blood_type_verified", "blood_type_estimated", "updated_at"])
        invalidate_nearby_cache_for_city(profile.city)
        return profile

    def toggle_availability(self, user_id):
        profile = self.get_profile(user_id)
        profile.availability_status = AvailabilityStatus.UNAVAILABLE if profile.availability_status == AvailabilityStatus.AVAILABLE else AvailabilityStatus.AVAILABLE
        profile.save(update_fields=["availability_status", "updated_at"])
        invalidate_nearby_cache_for_city(profile.city)
        return profile

    @transaction.atomic
    def record_donation(self, donor_profile_id, source_type, source_id, facility_name, facility_user_id, volume_ml, donation_date, recorded_by_user_id, notes=""):
        profile = DonorProfile.objects.select_for_update().get(id=donor_profile_id)
        if int(volume_ml) < 350:
            raise ValueError("Minimum donation volume is 350ml.")
        if not profile.is_eligible_to_donate():
            raise ValueError(f"Donor not eligible. Next eligible date: {profile.get_next_eligible_date()}")

        record = DonationRecord.objects.create(
            donor_profile=profile,
            source_type=source_type,
            source_id=source_id,
            facility_name=facility_name,
            facility_user_id=facility_user_id,
            volume_ml=volume_ml,
            donation_date=donation_date,
            recorded_by_user_id=recorded_by_user_id,
            notes=notes,
        )
        profile.last_donation_date = donation_date
        profile.total_donations += 1
        profile.total_volume_ml += int(volume_ml)
        profile.save(update_fields=["last_donation_date", "total_donations", "total_volume_ml", "updated_at"])
        return record

    def get_donation_history(self, user_id):
        return self.get_profile(user_id).donation_records.all()

    def get_donor_card(self, user_id):
        return self.get_profile(user_id).virtual_card

    def find_nearby(self, blood_type_needed, lat, lng, radius_km=None):
        radius = min(int(radius_km or settings.DEFAULT_MATCHING_RADIUS_KM), settings.MAX_MATCHING_RADIUS_KM)
        cached = get_cached_nearby(blood_type_needed, lat, lng, radius)
        if cached is not None:
            return list(DonorProfile.objects.filter(user_id__in=cached))
        compatible_types = DonorProfile.objects.get_compatible_blood_types(blood_type_needed)
        donors = DonorProfile.objects.find_nearby_donors(compatible_types, lat, lng, radius)
        set_cached_nearby(blood_type_needed, lat, lng, radius, [str(d.user_id) for d in donors])
        return donors
