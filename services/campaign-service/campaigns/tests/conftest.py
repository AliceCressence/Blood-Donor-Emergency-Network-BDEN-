import uuid
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from campaigns.models import DonationCampaign


def make_jwt_client(user_id, role="HOSPITAL", is_verified=True):
    token = AccessToken()
    token["user_id"] = str(user_id)
    token["role"] = role
    token["is_verified"] = is_verified
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.fixture
def hospital_user_id():
    return uuid.uuid4()


@pytest.fixture
def donor_user_id():
    return uuid.uuid4()


@pytest.fixture
def admin_user_id():
    return uuid.uuid4()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def hospital_client(hospital_user_id):
    return make_jwt_client(hospital_user_id, "HOSPITAL", True)


@pytest.fixture
def donor_client(donor_user_id):
    return make_jwt_client(donor_user_id, "DONOR", True)


@pytest.fixture
def admin_client(admin_user_id):
    return make_jwt_client(admin_user_id, "ADMIN", True)


@pytest.fixture
def pending_campaign(db, hospital_user_id):
    return DonationCampaign.objects.create(
        hospital_user_id=hospital_user_id,
        hospital_name="General Hospital Yaounde",
        hospital_email="hospital@bden.cm",
        title="May Blood Drive",
        description="Help us replenish our reserves.",
        blood_types_needed=["O-", "O+", "A+"],
        target_donors=30,
        target_volume_ml=12000,
        donor_incentives="Free blood panel for donors.",
        start_datetime=timezone.now() + timedelta(days=7),
        end_datetime=timezone.now() + timedelta(days=8),
        latitude=3.8667,
        longitude=11.5167,
        city="Yaounde",
        address="Avenue Kennedy",
    )


@pytest.fixture
def approved_campaign(pending_campaign, admin_user_id):
    pending_campaign.approve(str(admin_user_id))
    return pending_campaign
