import math
import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

VALID_BLOOD_TYPES = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
PUBLIC_STATUSES = {"APPROVED", "ONGOING"}


class DonationCampaignManager(models.Manager):
    def get_public(self, city=None, blood_type=None):
        qs = self.get_queryset().filter(status__in=PUBLIC_STATUSES, end_datetime__gte=timezone.now())
        if city:
            qs = qs.filter(city__icontains=city)
        if blood_type:
            qs = [campaign for campaign in qs if not campaign.blood_types_needed or blood_type in campaign.blood_types_needed]
        return qs

    def get_pending(self):
        return self.get_queryset().filter(status=DonationCampaign.CampaignStatus.PENDING)

    def get_for_hospital(self, hospital_user_id):
        return self.get_queryset().filter(hospital_user_id=hospital_user_id)

    def get_nearby(self, latitude, longitude, radius_km=30, city=None, blood_type=None):
        campaigns = list(self.get_public(city=city, blood_type=blood_type))
        nearby = []
        for campaign in campaigns:
            distance = haversine_km(latitude, longitude, campaign.latitude, campaign.longitude)
            if distance <= radius_km:
                campaign._distance_km = round(distance, 2)
                nearby.append(campaign)
        return sorted(nearby, key=lambda item: item._distance_km)


def haversine_km(lat1, lon1, lat2, lon2):
    radius = 6371
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class DonationCampaign(models.Model):
    class CampaignStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        APPROVED = "APPROVED", "Approved"
        ONGOING = "ONGOING", "Ongoing"
        COMPLETED = "COMPLETED", "Completed"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital_user_id = models.UUIDField(db_index=True)
    hospital_name = models.CharField(max_length=255)
    hospital_email = models.EmailField(blank=True, default="")
    title = models.CharField(max_length=255)
    description = models.TextField()
    blood_types_needed = models.JSONField(default=list, blank=True)
    target_donors = models.PositiveIntegerField(null=True, blank=True)
    target_volume_ml = models.PositiveIntegerField(null=True, blank=True)
    donor_incentives = models.TextField(blank=True, default="")
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    city = models.CharField(max_length=100)
    address = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=12, choices=CampaignStatus.choices, default=CampaignStatus.PENDING, db_index=True)
    rejection_reason = models.CharField(max_length=500, blank=True, default="")
    approved_by = models.UUIDField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    actual_donors = models.PositiveIntegerField(default=0)
    actual_volume_ml = models.PositiveIntegerField(default=0)
    interested_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DonationCampaignManager()

    class Meta:
        db_table = "donation_campaigns"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["hospital_user_id"]),
            models.Index(fields=["status", "start_datetime"]),
            models.Index(fields=["city", "status"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"

    def clean(self):
        if self.end_datetime <= self.start_datetime:
            raise ValidationError({"end_datetime": "End date must be after start date."})
        if self._state.adding and self.start_datetime < timezone.now():
            raise ValidationError({"start_datetime": "Campaigns cannot start in the past."})
        if self.target_donors is not None and self.target_donors < 1:
            raise ValidationError({"target_donors": "Target donors must be at least 1."})
        if self.target_volume_ml is not None and self.target_volume_ml < 350:
            raise ValidationError({"target_volume_ml": "Target volume must be at least 350ml."})
        if not isinstance(self.blood_types_needed, list):
            raise ValidationError({"blood_types_needed": "Blood types must be a list."})
        invalid = set(self.blood_types_needed) - VALID_BLOOD_TYPES
        if invalid:
            raise ValidationError({"blood_types_needed": f"Unsupported blood types: {', '.join(sorted(invalid))}"})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def is_ongoing(self):
        now = timezone.now()
        return self.start_datetime <= now <= self.end_datetime

    def is_upcoming(self):
        return self.start_datetime > timezone.now()

    def get_donor_progress_pct(self):
        if not self.target_donors:
            return None
        return round((self.actual_donors / self.target_donors) * 100, 1)

    def get_volume_progress_pct(self):
        if not self.target_volume_ml:
            return None
        return round((self.actual_volume_ml / self.target_volume_ml) * 100, 1)

    def approve(self, admin_user_id):
        self.status = self.CampaignStatus.APPROVED
        self.approved_by = admin_user_id
        self.approved_at = timezone.now()
        self.rejection_reason = ""
        self.save(update_fields=["status", "approved_by", "approved_at", "rejection_reason", "updated_at"])

    def reject(self, admin_user_id, reason):
        self.status = self.CampaignStatus.REJECTED
        self.approved_by = admin_user_id
        self.approved_at = timezone.now()
        self.rejection_reason = reason
        self.save(update_fields=["status", "approved_by", "approved_at", "rejection_reason", "updated_at"])

    def cancel(self):
        self.status = self.CampaignStatus.CANCELLED
        self.save(update_fields=["status", "updated_at"])


class CampaignInterest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(DonationCampaign, on_delete=models.CASCADE, related_name="interests")
    donor_user_id = models.UUIDField(db_index=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "campaign_interests"
        unique_together = [["campaign", "donor_user_id"]]
