# blood_requests/models.py
import uuid
from django.db import models


class BloodRequest(models.Model):

    class UrgencyLevel(models.TextChoices):
        LOW      = "LOW",      "Low"
        MEDIUM   = "MEDIUM",   "Medium"
        HIGH     = "HIGH",     "High"
        CRITICAL = "CRITICAL", "Critical"

    class Status(models.TextChoices):
        ACTIVE    = "ACTIVE",    "Active"
        OPEN      = "OPEN",      "Open"
        MATCHED   = "MATCHED",   "Matched"
        PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED", "Partially fulfilled"
        FULFILLED = "FULFILLED", "Fulfilled"
        EXPIRED   = "EXPIRED",   "Expired"
        CANCELLED = "CANCELLED", "Cancelled"

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital_id     = models.UUIDField(db_index=True)
    hospital_name   = models.CharField(max_length=255)
    city            = models.CharField(max_length=100)
    blood_type      = models.CharField(max_length=3)
    units_needed    = models.PositiveIntegerField(default=1)
    urgency         = models.CharField(
                        max_length=10,
                        choices=UrgencyLevel.choices,
                        default=UrgencyLevel.HIGH
                      )
    status          = models.CharField(
                        max_length=24,
                        choices=Status.choices,
                        default=Status.ACTIVE
                      )
    notes           = models.TextField(blank=True, default="")
    latitude        = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude       = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    expires_at      = models.DateTimeField(null=True, blank=True)
    fulfilled_at    = models.DateTimeField(null=True, blank=True)
    cancelled_at    = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, default="")

    class Meta:
        db_table = "blood_requests"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "city"]),
            models.Index(fields=["blood_type", "city"]),
            models.Index(fields=["hospital_id"]),
        ]

    def __str__(self):
        return f"{self.blood_type} request from {self.hospital_name} [{self.status}]"


class RequestResponse(models.Model):

    class ResponseStatus(models.TextChoices):
        PENDING     = "PENDING",     "Pending"
        ACCEPTED    = "ACCEPTED",    "Accepted"
        DECLINED    = "DECLINED",    "Declined"
        NO_RESPONSE = "NO_RESPONSE", "No response"
        UNAVAILABLE = "UNAVAILABLE", "Unavailable"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request     = models.ForeignKey(
                    BloodRequest,
                    on_delete=models.CASCADE,
                    related_name="responses"
                  )
    donor_id    = models.UUIDField(db_index=True)
    status      = models.CharField(
                    max_length=16,
                    choices=ResponseStatus.choices,
                    default=ResponseStatus.PENDING
                  )
    donor_name  = models.CharField(max_length=255, blank=True, default="")
    donor_blood_type = models.CharField(max_length=3, blank=True, default="")
    donor_phone = models.CharField(max_length=32, blank=True, default="")
    distance_km = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    responded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "request_responses"
        unique_together = [("request", "donor_id")]
        indexes = [
            models.Index(fields=["request", "status"]),
        ]

    def __str__(self):
        return f"Donor {self.donor_id} → {self.status} for request {self.request_id}"


class MatchingResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(
        BloodRequest,
        on_delete=models.CASCADE,
        related_name="matching_results",
    )
    donor_id = models.UUIDField(db_index=True)
    distance_km = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    compatibility_score = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "request_matching_results"
        unique_together = [("request", "donor_id")]
        ordering = ["distance_km", "-compatibility_score"]
        indexes = [
            models.Index(fields=["request", "compatibility_score"]),
        ]

    def __str__(self):
        return f"Match {self.donor_id} for request {self.request_id}"
