# blood_requests/admin.py
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import BloodRequest, RequestResponse


@admin.register(BloodRequest)
class BloodRequestAdmin(ModelAdmin):
    list_display  = ["hospital_name", "blood_type", "urgency", "status", "city", "created_at"]
    list_filter   = ["status", "urgency", "blood_type"]
    search_fields = ["hospital_name", "city", "blood_type"]
    readonly_fields = ["id", "created_at", "fulfilled_at"]


@admin.register(RequestResponse)
class RequestResponseAdmin(ModelAdmin):
    list_display  = ["request", "donor_id", "status", "responded_at"]
    list_filter   = ["status"]
    readonly_fields = ["id", "responded_at"]