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
        MATCHED   = "MATCHED",   "Matched"
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
                        max_length=10,
                        choices=Status.choices,
                        default=Status.ACTIVE
                      )
    notes           = models.TextField(blank=True, default="")
    created_at      = models.DateTimeField(auto_now_add=True)
    expires_at      = models.DateTimeField(null=True, blank=True)
    fulfilled_at    = models.DateTimeField(null=True, blank=True)

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
        ACCEPTED    = "ACCEPTED",    "Accepted"
        DECLINED    = "DECLINED",    "Declined"
        UNAVAILABLE = "UNAVAILABLE", "Unavailable"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request     = models.ForeignKey(
                    BloodRequest,
                    on_delete=models.CASCADE,
                    related_name="responses"
                  )
    donor_id    = models.UUIDField(db_index=True)
    status      = models.CharField(
                    max_length=12,
                    choices=ResponseStatus.choices,
                    default=ResponseStatus.ACCEPTED
                  )
    responded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "request_responses"
        unique_together = [("request", "donor_id")]
        indexes = [
            models.Index(fields=["request", "status"]),
        ]

    def __str__(self):
        return f"Donor {self.donor_id} → {self.status} for request {self.request_id}"