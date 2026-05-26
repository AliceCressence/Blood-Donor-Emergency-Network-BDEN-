import uuid

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from donors.models import DonorProfile, ScreeningCenter, VirtualDonorCard


@pytest.fixture
def api_client():
    return APIClient()


def make_jwt_client(user_id, role="DONOR", is_verified=True):
    client = APIClient()
    token = AccessToken()
    token["user_id"] = str(user_id)
    token["role"] = role
    token["is_verified"] = is_verified
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
    return client


@pytest.fixture
def donor_user_id():
    return uuid.uuid4()


@pytest.fixture
def donor_profile(db, donor_user_id):
    profile = DonorProfile.objects.create(
        user_id=donor_user_id,
        first_name="Jean",
        last_name="Mbarga",
        phone="+237600000000",
        blood_type="O+",
        blood_type_verified=True,
        city="Yaounde",
        region="Centre",
        latitude=3.8667,
        longitude=11.5167,
        availability_status="AVAILABLE",
    )
    VirtualDonorCard.objects.create(donor_profile=profile)
    return profile


@pytest.fixture
def donor_client(donor_profile):
    return make_jwt_client(donor_profile.user_id, role="DONOR")


@pytest.fixture
def hospital_client():
    return make_jwt_client(uuid.uuid4(), role="HOSPITAL", is_verified=True)


@pytest.fixture
def admin_client():
    return make_jwt_client(uuid.uuid4(), role="ADMIN", is_verified=True)


@pytest.fixture
def screening_center(db):
    return ScreeningCenter.objects.create(
        name="Test Screening Center",
        facility_type="Blood Bank",
        city="Yaounde",
        region="Centre",
        latitude=3.8700,
        longitude=11.5100,
        is_active=True,
    )
