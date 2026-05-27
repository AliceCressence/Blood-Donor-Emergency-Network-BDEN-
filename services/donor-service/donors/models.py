import uuid
from datetime import timedelta

from django.db import models
from django.utils import timezone

from .managers import DonorProfileManager


class BloodType(models.TextChoices):
    A_POS = "A+", "A+"
    A_NEG = "A-", "A-"
    B_POS = "B+", "B+"
    B_NEG = "B-", "B-"
    AB_POS = "AB+", "AB+"
    AB_NEG = "AB-", "AB-"
    O_POS = "O+", "O+"
    O_NEG = "O-", "O-"
    UNKNOWN = "UNKNOWN", "Unknown"


class AvailabilityStatus(models.TextChoices):
    AVAILABLE = "AVAILABLE", "Available"
    UNAVAILABLE = "UNAVAILABLE", "Unavailable"
    BUSY = "BUSY", "Busy"


class Gender(models.TextChoices):
    MALE = "MALE", "Male"
    FEMALE = "FEMALE", "Female"

class DonorProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, default="")
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    date_of_birth = models.DateField(null=True, blank=True)
    blood_type = models.CharField(max_length=10, choices=BloodType.choices, default=BloodType.UNKNOWN)
    blood_type_verified = models.BooleanField(default=False)
    blood_type_estimated = models.CharField(max_length=100, blank=True, default="")
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    city = models.CharField(max_length=100, blank=True, default="")
    region = models.CharField(max_length=100, blank=True, default="")
    availability_status = models.CharField(max_length=15, choices=AvailabilityStatus.choices, default=AvailabilityStatus.AVAILABLE)
    last_donation_date = models.DateField(null=True, blank=True)
    total_donations = models.PositiveIntegerField(default=0)
    total_volume_ml = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DonorProfileManager()

    class Meta:
        db_table = "donor_profiles"
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["blood_type", "availability_status"]),
            models.Index(fields=["city"]),
        ]

    def __str__(self):
        return self.get_full_name()

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def is_eligible_to_donate(self):
        if self.last_donation_date is None:
            return True
        return (timezone.localdate() - self.last_donation_date).days >= 90

    def days_until_eligible(self):
        if self.is_eligible_to_donate():
            return 0
        return 90 - (timezone.localdate() - self.last_donation_date).days

    def get_next_eligible_date(self):
        if self.last_donation_date is None:
            return None
        return self.last_donation_date + timedelta(days=90)

    def has_location(self):
        return self.latitude is not None and self.longitude is not None


class DonationRecord(models.Model):
    class SourceType(models.TextChoices):
        EMERGENCY_REQUEST = "EMERGENCY_REQUEST", "Emergency Request"
        CAMPAIGN = "CAMPAIGN", "Campaign"
        INDEPENDENT = "INDEPENDENT", "Independent"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor_profile = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name="donation_records")
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    source_id = models.UUIDField(null=True, blank=True)
    facility_name = models.CharField(max_length=255)
    facility_user_id = models.UUIDField(null=True, blank=True)
    volume_ml = models.PositiveIntegerField()
    donation_date = models.DateField()
    recorded_by_user_id = models.UUIDField()
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "donation_records"
        ordering = ["-donation_date"]
        indexes = [
            models.Index(fields=["donor_profile", "donation_date"]),
            models.Index(fields=["source_type", "source_id"]),
        ]


class VirtualDonorCard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor_profile = models.OneToOneField(DonorProfile, on_delete=models.CASCADE, related_name="virtual_card")
    card_number = models.CharField(max_length=30, unique=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "virtual_donor_cards"

    def save(self, *args, **kwargs):
        if not self.card_number:
            city_code = (self.donor_profile.city[:3] or "UNK").upper()
            year = timezone.localdate().year
            sequence = VirtualDonorCard.objects.filter(card_number__startswith=f"BDEN-{city_code}-{year}-").count() + 1
            self.card_number = f"BDEN-{city_code}-{year}-{sequence:05d}"
        super().save(*args, **kwargs)

    @property
    def total_donations(self):
        return self.donor_profile.total_donations

    @property
    def total_volume_ml(self):
        return self.donor_profile.total_volume_ml

    @property
    def last_donation_date(self):
        return self.donor_profile.last_donation_date

    @property
    def next_eligible_date(self):
        return self.donor_profile.get_next_eligible_date()

    @property
    def is_eligible_now(self):
        return self.donor_profile.is_eligible_to_donate()

    @property
    def is_regular_donor(self):
        return self.donor_profile.total_donations >= 3

    @property
    def blood_type(self):
        return self.donor_profile.blood_type


class ScreeningCenter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=50)
    address = models.CharField(max_length=255, blank=True, default="")
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True, default="")
    latitude = models.FloatField()
    longitude = models.FloatField()
    phone = models.CharField(max_length=20, blank=True, default="")
    opening_hours = models.CharField(max_length=100, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "screening_centers"
        indexes = [
            models.Index(fields=["city"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name
