import pytest


@pytest.mark.django_db
def test_estimation_chat_flow(donor_client, donor_profile, screening_center):
    donor_profile.blood_type_verified = False
    donor_profile.save()
    assert donor_client.post("/api/estimation/chat/", {"message": ""}, format="json").status_code == 400
    assert donor_client.post("/api/estimation/chat/", {"message": "Hello"}, format="json").data["session_complete"] is False
    donor_client.post("/api/estimation/chat/", {"message": "Mother O+"}, format="json")
    res = donor_client.post("/api/estimation/chat/", {"message": "Sibling A+"}, format="json")
    assert res.status_code == 200
    assert res.data["session_complete"] is True
    assert res.data["screening_centers"]


@pytest.mark.django_db
def test_verified_donor_blocked(donor_client, donor_profile):
    donor_profile.blood_type_verified = True
    donor_profile.save()
    assert donor_client.post("/api/estimation/chat/", {"message": "Hello"}, format="json").status_code == 400


@pytest.mark.django_db
def test_estimation_session(donor_client, donor_profile):
    donor_profile.blood_type_verified = False
    donor_profile.save()
    assert donor_client.get("/api/estimation/session/").status_code == 404
    donor_client.post("/api/estimation/chat/", {"message": "Hello"}, format="json")
    assert donor_client.get("/api/estimation/session/").status_code == 200
