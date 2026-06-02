from datetime import timedelta

import pytest
from django.utils import timezone

from campaigns.models import DonationCampaign


def payload():
    start = timezone.now() + timedelta(days=5)
    return {
        "hospital_name": "Central Hospital",
        "hospital_email": "central@bden.cm",
        "title": "Community Blood Drive",
        "description": "A friendly blood donation day for the city.",
        "blood_types_needed": ["O-", "O+"],
        "target_donors": 20,
        "target_volume_ml": 8000,
        "donor_incentives": "Free screening for donors.",
        "start_datetime": start.isoformat(),
        "end_datetime": (start + timedelta(hours=8)).isoformat(),
        "latitude": 3.8667,
        "longitude": 11.5167,
        "city": "Yaounde",
        "address": "Avenue Kennedy",
    }


@pytest.mark.django_db
def test_public_list_only_returns_approved(api_client, pending_campaign, approved_campaign):
    res = api_client.get("/api/campaigns/")
    assert res.status_code == 200
    assert len(res.data) == 1
    assert res.data[0]["status"] == DonationCampaign.CampaignStatus.APPROVED


@pytest.mark.django_db
def test_hospital_create_and_admin_review(hospital_client, admin_client):
    res = hospital_client.post("/api/campaigns/", payload(), format="json")
    assert res.status_code == 201
    assert res.data["status"] == DonationCampaign.CampaignStatus.PENDING
    campaign_id = res.data["id"]

    pending = admin_client.get("/api/campaigns/pending/")
    assert pending.status_code == 200
    assert len(pending.data) == 1

    review = admin_client.post(f"/api/campaigns/{campaign_id}/review/", {"action": "approve"}, format="json")
    assert review.status_code == 200
    assert review.data["status"] == DonationCampaign.CampaignStatus.APPROVED


@pytest.mark.django_db
def test_donor_interest_is_idempotent(donor_client, approved_campaign):
    url = f"/api/campaigns/{approved_campaign.id}/interest/"
    first = donor_client.post(url)
    second = donor_client.post(url)
    assert first.status_code == 201
    assert second.status_code == 200
    removed = donor_client.delete(url)
    assert removed.status_code == 200
