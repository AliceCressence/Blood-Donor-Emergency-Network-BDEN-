import uuid

from django.db import models


class DonorProfile(models.Model):
    class BloodTypeStatus(models.TextChoices):
        UNKNOWN = "UNKNOWN", "Unknown"
        ESTIMATED = "ESTIMATED", "Estimated"
        VERIFIED = "VERIFIED", "Verified"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    blood_type = models.CharField(max_length=3, blank=True, default="")
    blood_type_status = models.CharField(max_length=10, choices=BloodTypeStatus.choices, default=BloodTypeStatus.UNKNOWN)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "donor_profiles"
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["city", "is_available"]),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()
