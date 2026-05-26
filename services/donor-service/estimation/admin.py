from django.contrib import admin
from unfold.admin import ModelAdmin as UnfoldModelAdmin

from .models import BloodTypeEstimationSession


@admin.register(BloodTypeEstimationSession)
class EstimationSessionAdmin(UnfoldModelAdmin):
    list_display = ("donor_profile", "completed", "estimation_result", "created_at")
    list_filter = ("completed",)
    search_fields = ("donor_profile__first_name", "donor_profile__last_name", "estimation_result")
    readonly_fields = ("id", "messages", "created_at", "updated_at")
    ordering = ("-created_at",)
