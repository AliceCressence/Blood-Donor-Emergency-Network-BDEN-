from datetime import timedelta
import uuid

import pytest
from django.utils import timezone

from donors.models import DonorProfile, VirtualDonorCard
from donors.services import DonorProfileService


@pytest.mark.django_db
def test_create_profile_creates_card():
    user_id = uuid.uuid4()
    profile = DonorProfileService().create_profile(user_id, "Alice", "Test", "", "Douala")
    assert DonorProfile.objects.filter(user_id=user_id).exists()
    assert VirtualDonorCard.objects.filter(donor_profile=profile).exists()


@pytest.mark.django_db
def test_create_profile_rejects_duplicate(donor_profile):
    with pytest.raises(ValueError):
        DonorProfileService().create_profile(donor_profile.user_id, "Jean")


@pytest.mark.django_db
def test_update_profile_only_permitted_fields(donor_profile):
    DonorProfileService().update_profile(donor_profile.user_id, {"city": "Douala", "unknown": "x"})
    donor_profile.refresh_from_db()
    assert donor_profile.city == "Douala"
    assert not hasattr(donor_profile, "unknown")


@pytest.mark.django_db
def test_update_blood_type_verified_clears_estimate(donor_profile):
    donor_profile.blood_type_estimated = "Likely A+"
    donor_profile.save()
    DonorProfileService().update_blood_type(donor_profile.user_id, "A+", True)
    donor_profile.refresh_from_db()
    assert donor_profile.blood_type == "A+"
    assert donor_profile.blood_type_verified is True
    assert donor_profile.blood_type_estimated == ""


@pytest.mark.django_db
def test_toggle_availability(donor_profile):
    service = DonorProfileService()
    assert service.toggle_availability(donor_profile.user_id).availability_status == "UNAVAILABLE"
    assert service.toggle_availability(donor_profile.user_id).availability_status == "AVAILABLE"


@pytest.mark.django_db
def test_record_donation_rules(donor_profile):
    service = DonorProfileService()
    with pytest.raises(ValueError):
        service.record_donation(donor_profile.id, "INDEPENDENT", None, "Hospital", None, 300, timezone.localdate(), uuid.uuid4())
    donor_profile.last_donation_date = timezone.localdate() - timedelta(days=10)
    donor_profile.save()
    with pytest.raises(ValueError):
        service.record_donation(donor_profile.id, "INDEPENDENT", None, "Hospital", None, 450, timezone.localdate(), uuid.uuid4())


@pytest.mark.django_db
def test_record_donation_updates_totals(donor_profile):
    record = DonorProfileService().record_donation(donor_profile.id, "INDEPENDENT", None, "Hospital", None, 450, timezone.localdate(), uuid.uuid4())
    donor_profile.refresh_from_db()
    assert record.volume_ml == 450
    assert donor_profile.total_donations == 1
    assert donor_profile.total_volume_ml == 450
