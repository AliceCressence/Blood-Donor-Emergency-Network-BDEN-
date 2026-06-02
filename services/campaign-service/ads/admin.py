from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import DonorDashboardBanner


@admin.register(DonorDashboardBanner)
class DonorDashboardBannerAdmin(ModelAdmin):
    list_display = ("title", "is_active", "updated_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("title", "alt_text", "image_url")
