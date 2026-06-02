import uuid

from django.db import models


class DonorDashboardBanner(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=120)
    image_url = models.URLField(max_length=1000)
    alt_text = models.CharField(max_length=180, blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "donor_dashboard_banners"
        ordering = ["-is_active", "-updated_at"]

    def __str__(self):
        return self.title
