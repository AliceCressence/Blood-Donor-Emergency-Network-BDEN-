from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import DonorProfile


@admin.register(DonorProfile)
class DonorProfileAdmin(ModelAdmin):
    list_display = ("first_name", "last_name", "city", "blood_type", "blood_type_status", "is_available", "created_at")
    list_filter = ("blood_type_status", "is_available", "city")
    search_fields = ("first_name", "last_name", "phone", "city", "user_id")
    readonly_fields = ("id", "user_id", "created_at", "updated_at")
