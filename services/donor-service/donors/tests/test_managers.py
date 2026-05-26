import uuid

import pytest

from donors.models import DonorProfile


@pytest.mark.django_db
def test_get_by_user_id(donor_profile):
    assert DonorProfile.objects.get_by_user_id(donor_profile.user_id) == donor_profile
    with pytest.raises(DonorProfile.DoesNotExist):
        DonorProfile.objects.get_by_user_id(uuid.uuid4())


def test_compatible_blood_types():
    assert DonorProfile.objects.get_compatible_blood_types("O-") == ["O-"]
    assert DonorProfile.objects.get_compatible_blood_types("AB+") == ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    assert DonorProfile.objects.get_compatible_blood_types("A+") == ["O-", "O+", "A-", "A+"]


@pytest.mark.django_db
def test_find_nearby_donors_filters_and_sorts(donor_profile):
    far = DonorProfile.objects.create(
        user_id=uuid.uuid4(),
        first_name="Far",
        blood_type="O+",
        blood_type_verified=True,
        availability_status="AVAILABLE",
        latitude=10.0,
        longitude=10.0,
    )
    unverified = DonorProfile.objects.create(
        user_id=uuid.uuid4(),
        first_name="Unverified",
        blood_type="O+",
        blood_type_verified=False,
        availability_status="AVAILABLE",
        latitude=3.867,
        longitude=11.517,
    )
    donors = DonorProfile.objects.find_nearby_donors(["O+"], 3.8667, 11.5167, 30)
    assert donor_profile in donors
    assert far not in donors
    assert unverified not in donors
    assert hasattr(donors[0], "_distance_km")


@pytest.mark.django_db
def test_find_nearby_respects_exclude_user_ids(donor_profile):
    donors = DonorProfile.objects.find_nearby_donors(["O+"], 3.8667, 11.5167, 30, exclude_user_ids=[donor_profile.user_id])
    assert donor_profile not in donors
