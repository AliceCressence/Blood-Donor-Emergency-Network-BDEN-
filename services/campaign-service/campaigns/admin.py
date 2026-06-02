from django.contrib import admin, messages
from unfold.admin import ModelAdmin

from .events import publish_event
from .models import CampaignInterest, DonationCampaign


@admin.register(DonationCampaign)
class DonationCampaignAdmin(ModelAdmin):
    list_display = ("title", "hospital_name", "city", "status", "start_datetime", "interested_count", "actual_donors")
    list_filter = ("status", "city", "start_datetime")
    search_fields = ("title", "hospital_name", "city", "hospital_email")
    readonly_fields = ("id", "created_at", "updated_at", "approved_at")
    actions = ("approve_selected_campaigns", "reject_selected_campaigns")

    @admin.action(description="Approve selected pending campaigns")
    def approve_selected_campaigns(self, request, queryset):
        count = 0
        for campaign in queryset.filter(status=DonationCampaign.CampaignStatus.PENDING):
            campaign.approve(str(request.user.id))
            publish_event(
                "CAMPAIGN_APPROVED",
                {
                    "campaign_id": str(campaign.id),
                    "hospital_user_id": str(campaign.hospital_user_id),
                    "hospital_name": campaign.hospital_name,
                    "title": campaign.title,
                    "city": campaign.city,
                    "blood_types_needed": campaign.blood_types_needed,
                    "start_datetime": campaign.start_datetime,
                    "end_datetime": campaign.end_datetime,
                },
            )
            count += 1
        self.message_user(request, f"Approved {count} campaign(s).", messages.SUCCESS)

    @admin.action(description="Reject selected pending campaigns")
    def reject_selected_campaigns(self, request, queryset):
        count = 0
        for campaign in queryset.filter(status=DonationCampaign.CampaignStatus.PENDING):
            campaign.reject(str(request.user.id), "Rejected from Django admin.")
            count += 1
        self.message_user(request, f"Rejected {count} campaign(s).", messages.WARNING)


@admin.register(CampaignInterest)
class CampaignInterestAdmin(ModelAdmin):
    list_display = ("campaign", "donor_user_id", "registered_at")
    search_fields = ("campaign__title", "donor_user_id")
    readonly_fields = ("id", "registered_at")
