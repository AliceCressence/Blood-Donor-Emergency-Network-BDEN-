import uuid

import pytest
from django.db import IntegrityError

from campaigns.models import CampaignInterest, DonationCampaign


@pytest.mark.django_db
def test_campaign_progress_and_interest_constraints(approved_campaign, donor_user_id):
    approved_campaign.actual_donors = 15
    approved_campaign.actual_volume_ml = 6000
    assert approved_campaign.get_donor_progress_pct() == 50
    assert approved_campaign.get_volume_progress_pct() == 50
    assert approved_campaign.is_upcoming() is True

    CampaignInterest.objects.create(campaign=approved_campaign, donor_user_id=donor_user_id)
    with pytest.raises(IntegrityError):
        CampaignInterest.objects.create(campaign=approved_campaign, donor_user_id=donor_user_id)


@pytest.mark.django_db
def test_campaign_review_helpers(pending_campaign):
    admin_id = uuid.uuid4()
    pending_campaign.approve(str(admin_id))
    assert pending_campaign.status == DonationCampaign.CampaignStatus.APPROVED
    assert str(pending_campaign.approved_by) == str(admin_id)
    pending_campaign.reject(str(admin_id), "Needs clearer location")
    assert pending_campaign.status == DonationCampaign.CampaignStatus.REJECTED
    assert pending_campaign.rejection_reason == "Needs clearer location"
    pending_campaign.cancel()
    assert pending_campaign.status == DonationCampaign.CampaignStatus.CANCELLED
