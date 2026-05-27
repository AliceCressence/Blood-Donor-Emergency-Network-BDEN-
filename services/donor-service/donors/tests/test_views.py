import uuid

import pytest
from django.conf import settings
from django.utils import timezone

from donors.models import DonorProfile


@pytest.mark.django_db
def test_get_profile(donor_client, donor_profile):
    res = donor_client.get("/api/donors/me/")
    assert res.status_code == 200
    assert res.data["user_id"] == str(donor_profile.user_id)


@pytest.mark.django_db
def test_get_profile_unauthenticated(api_client):
    assert api_client.get("/api/donors/me/").status_code == 401


@pytest.mark.django_db
def test_patch_profile_validation(donor_client):
    assert donor_client.patch("/api/donors/me/", {"city": "Douala"}, format="json").status_code == 200
    assert donor_client.patch("/api/donors/me/", {"latitude": 4.1}, format="json").status_code == 400
    assert donor_client.patch("/api/donors/me/", {"availability_status": "NOPE"}, format="json").status_code == 400


@pytest.mark.django_db
def test_blood_type_update(donor_client):
    assert donor_client.patch("/api/donors/me/blood-type/", {"blood_type": "A+", "verified": True}, format="json").status_code == 200
    assert donor_client.patch("/api/donors/me/blood-type/", {"blood_type": "UNKNOWN"}, format="json").status_code == 400


@pytest.mark.django_db
def test_card_and_history(donor_client):
    assert donor_client.get("/api/donors/me/card/").status_code == 200
    assert donor_client.get("/api/donors/me/donations/").status_code == 200


@pytest.mark.django_db
def test_record_donation_permissions(hospital_client, donor_client, donor_profile):
    payload = {"donor_user_id": str(donor_profile.user_id), "source_type": "INDEPENDENT", "facility_name": "Hospital", "volume_ml": 450, "donation_date": str(timezone.localdate())}
    assert donor_client.post("/api/donors/donations/record/", payload, format="json").status_code == 403
    assert hospital_client.post("/api/donors/donations/record/", payload, format="json").status_code == 201


@pytest.mark.django_db
def test_screening_centers_public(api_client, screening_center):
    res = api_client.get("/api/donors/screening-centers/?city=Yaounde")
    assert res.status_code == 200
    assert len(res.data) == 1


@pytest.mark.django_db
def test_internal_create_profile(api_client):
    payload = {"user_id": str(uuid.uuid4()), "first_name": "New", "city": "Yaounde"}
    assert api_client.post("/internal/donors/create-profile/", payload, format="json").status_code == 403
    res = api_client.post("/internal/donors/create-profile/", payload, HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY, format="json")
    assert res.status_code == 201
    assert api_client.post("/internal/donors/create-profile/", payload, HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY, format="json").status_code == 409


@pytest.mark.django_db
def test_internal_profile_status(api_client, donor_profile):
    assert api_client.get(f"/internal/donors/profile-status/?user_id={donor_profile.user_id}").status_code == 403
    res = api_client.get(f"/internal/donors/profile-status/?user_id={donor_profile.user_id}", HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY)
    assert res.status_code == 200
    assert res.data["profile_complete"] is True
    donor_profile.phone = ""
    donor_profile.save(update_fields=["phone"])
    res = api_client.get(f"/internal/donors/profile-status/?user_id={donor_profile.user_id}", HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY)
    assert res.data["profile_complete"] is False


@pytest.mark.django_db
def test_internal_nearby(api_client, donor_profile):
    assert api_client.get("/internal/donors/nearby/", HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY).status_code == 400
    res = api_client.get("/internal/donors/nearby/?blood_type=O%2B&lat=3.8667&lng=11.5167", HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY)
    assert res.status_code == 200
    assert res.data["count"] >= 1
