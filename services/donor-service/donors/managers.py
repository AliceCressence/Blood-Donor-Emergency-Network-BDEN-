from django.db import models
from geopy.distance import geodesic


class DonorProfileManager(models.Manager):
    def get_by_user_id(self, user_id):
        return self.get(user_id=user_id)

    def find_nearby_donors(self, blood_types, lat, lng, radius_km, exclude_user_ids=None):
        queryset = self.filter(
            blood_type__in=blood_types,
            availability_status="AVAILABLE",
            blood_type_verified=True,
            latitude__isnull=False,
            longitude__isnull=False,
        )
        if exclude_user_ids:
            queryset = queryset.exclude(user_id__in=exclude_user_ids)

        result = []
        for donor in queryset:
            distance = geodesic((lat, lng), (donor.latitude, donor.longitude)).km
            if distance <= radius_km:
                donor._distance_km = round(distance, 2)
                result.append(donor)
        result.sort(key=lambda donor: donor._distance_km)
        return result

    def get_compatible_blood_types(self, requested_type):
        compatibility = {
            "O-": ["O-"],
            "O+": ["O-", "O+"],
            "A-": ["O-", "A-"],
            "A+": ["O-", "O+", "A-", "A+"],
            "B-": ["O-", "B-"],
            "B+": ["O-", "O+", "B-", "B+"],
            "AB-": ["O-", "A-", "B-", "AB-"],
            "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        }
        return compatibility.get(requested_type, ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
