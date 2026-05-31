from django.db import transaction
from django.db.models import F
from django.conf import settings
import requests

from .events import publish_event
from .models import CampaignInterest, DonationCampaign, VALID_BLOOD_TYPES


class CampaignService:
    def create_campaign(self, hospital_user_id, data):
        campaign = DonationCampaign.objects.create(hospital_user_id=hospital_user_id, status=DonationCampaign.CampaignStatus.PENDING, **data)
        publish_event("CAMPAIGN_SUBMITTED", self._event_payload(campaign))
        return campaign

    def approve_campaign(self, campaign_id, admin_user_id):
        with transaction.atomic():
            campaign = DonationCampaign.objects.select_for_update().get(id=campaign_id, status=DonationCampaign.CampaignStatus.PENDING)
            campaign.approve(admin_user_id)
        publish_event("CAMPAIGN_APPROVED", {**self._event_payload(campaign), "nearby_donors": self._nearby_donors(campaign)})
        return campaign

    def reject_campaign(self, campaign_id, admin_user_id, reason):
        with transaction.atomic():
            campaign = DonationCampaign.objects.select_for_update().get(id=campaign_id, status=DonationCampaign.CampaignStatus.PENDING)
            campaign.reject(admin_user_id, reason)
        publish_event("CAMPAIGN_REJECTED", {**self._event_payload(campaign), "reason": reason})
        return campaign

    def update_progress(self, campaign, actual_donors, actual_volume_ml):
        if campaign.status == DonationCampaign.CampaignStatus.PENDING:
            raise ValueError("This campaign is still waiting for review, so progress cannot be added yet.")
        if actual_donors < 0 or actual_volume_ml < 0:
            raise ValueError("Progress values cannot be negative.")
        campaign.actual_donors = actual_donors
        campaign.actual_volume_ml = actual_volume_ml
        campaign.save(update_fields=["actual_donors", "actual_volume_ml", "updated_at"])
        publish_event("CAMPAIGN_PROGRESS_UPDATED", self._event_payload(campaign))
        return campaign

    def cancel_campaign(self, campaign):
        if campaign.status == DonationCampaign.CampaignStatus.COMPLETED:
            raise ValueError("Completed campaigns cannot be cancelled.")
        campaign.cancel()
        publish_event("CAMPAIGN_CANCELLED", self._event_payload(campaign))
        return campaign

    def register_interest(self, campaign, donor_user_id):
        interest, created = CampaignInterest.objects.get_or_create(campaign=campaign, donor_user_id=donor_user_id)
        if created:
            DonationCampaign.objects.filter(id=campaign.id).update(interested_count=F("interested_count") + 1)
            campaign.refresh_from_db(fields=["interested_count"])
        return interest, created

    def withdraw_interest(self, campaign, donor_user_id):
        deleted, _ = CampaignInterest.objects.filter(campaign=campaign, donor_user_id=donor_user_id).delete()
        if deleted:
            DonationCampaign.objects.filter(id=campaign.id, interested_count__gt=0).update(interested_count=F("interested_count") - 1)
            campaign.refresh_from_db(fields=["interested_count"])
        return deleted

    def _event_payload(self, campaign):
        return {
            "campaign_id": str(campaign.id),
            "hospital_user_id": str(campaign.hospital_user_id),
            "hospital_name": campaign.hospital_name,
            "hospital_email": campaign.hospital_email,
            "title": campaign.title,
            "city": campaign.city,
            "address": campaign.address,
            "latitude": campaign.latitude,
            "longitude": campaign.longitude,
            "blood_types_needed": campaign.blood_types_needed,
            "start_datetime": campaign.start_datetime,
            "end_datetime": campaign.end_datetime,
        }

    def _nearby_donors(self, campaign):
        donors_by_id = {}
        blood_types = campaign.blood_types_needed or sorted(VALID_BLOOD_TYPES)
        for blood_type in blood_types:
            try:
                response = requests.get(
                    f"{settings.DONOR_SERVICE_INTERNAL_URL}/internal/donors/nearby/",
                    params={
                        "blood_type": blood_type,
                        "lat": campaign.latitude,
                        "lng": campaign.longitude,
                    },
                    headers={"X-Internal-API-Key": settings.INTERNAL_API_KEY},
                    timeout=3,
                )
                response.raise_for_status()
            except requests.RequestException:
                continue
            for donor in response.json().get("donors", []):
                donor_id = donor.get("user_id") or donor.get("id")
                if donor_id:
                    donors_by_id[str(donor_id)] = donor
        return list(donors_by_id.values())
