# notifications/models.py
import uuid
from django.db import models


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        EMERGENCY = "EMERGENCY", "Emergency Request"
        CAMPAIGN  = "CAMPAIGN",  "Campaign"
        SYSTEM    = "SYSTEM",    "System"
        REMINDER  = "REMINDER",  "Reminder"

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id    = models.UUIDField(db_index=True)
    type       = models.CharField(
                   max_length=16,
                   choices=NotificationType.choices,
                   default=NotificationType.SYSTEM
                 )
    title      = models.CharField(max_length=255)
    body       = models.TextField()
    read       = models.BooleanField(default=False)
    data       = models.JSONField(default=dict, blank=True)
    email_status = models.CharField(max_length=16, default="PENDING")
    sent_at    = models.DateTimeField(null=True, blank=True)
    read_at    = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["user_id", "read"]),
            models.Index(fields=["user_id", "type"]),
        ]

    def __str__(self):
        return f"[{self.type}] {self.title} → user {self.user_id}"


class NotificationPreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True, db_index=True)
    emergency_push = models.BooleanField(default=True)
    emergency_email = models.BooleanField(default=True)
    campaign_push = models.BooleanField(default=True)
    campaign_email = models.BooleanField(default=False)
    system_push = models.BooleanField(default=True)
    system_email = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_preferences"

    def __str__(self):
        return f"Notification preferences for {self.user_id}"
