# notifications/models.py
import uuid
from django.db import models


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        EMERGENCY = "EMERGENCY", "Emergency Request"
        CAMPAIGN  = "CAMPAIGN",  "Campaign"
        SYSTEM    = "SYSTEM",    "System"

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id    = models.UUIDField(db_index=True)
    type       = models.CharField(
                   max_length=10,
                   choices=NotificationType.choices,
                   default=NotificationType.SYSTEM
                 )
    title      = models.CharField(max_length=255)
    body       = models.TextField()
    read       = models.BooleanField(default=False)
    data       = models.JSONField(default=dict, blank=True)
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