import uuid
from unittest.mock import Mock, patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from .models import BloodRequest, MatchingResult, RequestResponse
from .services import create_request, expire_open_requests, record_donor_response


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def hospital_id():
    return uuid.uuid4()


@pytest.fixture
def donor_id():
    return uuid.uuid4()


@pytest.fixture
def blood_request(hospital_id):
    return BloodRequest.objects.create(
        hospital_id=hospital_id,
        hospital_name="Central Hospital",
        city="Yaounde",
        blood_type="O+",
        units_needed=2,
        urgency=BloodRequest.UrgencyLevel.CRITICAL,
        latitude=3.8667,
        longitude=11.5167,
    )


@pytest.mark.django_db
def test_create_request_stores_matches_and_publishes_targeted_events(hospital_id, donor_id):
    second_donor = uuid.uuid4()
    donor_payload = [
        {"user_id": str(donor_id), "distance_km": 4.2, "compatibility_score": 90},
        {"donor_id": str(second_donor), "distance_km": 8.1, "compatibility_score": 80},
    ]
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = {"donors": donor_payload}

    with patch("blood_requests.services.requests.get", return_value=response), patch("blood_requests.services.publish_event") as publish:
        request = create_request(
            {
                "hospital_id": hospital_id,
                "hospital_name": "Central Hospital",
                "city": "Yaounde",
                "blood_type": "O+",
                "units_needed": 2,
                "urgency": BloodRequest.UrgencyLevel.CRITICAL,
                "latitude": 3.8667,
                "longitude": 11.5167,
            }
        )

    assert MatchingResult.objects.filter(request=request).count() == 2
    assert publish.call_count == 2
    assert {call.args[1]["donor_id"] for call in publish.call_args_list} == {str(donor_id), str(second_donor)}


@pytest.mark.django_db
def test_record_donor_response_partially_fulfills_then_matches(blood_request, donor_id):
    with patch("blood_requests.services.publish_event") as publish:
        first, created = record_donor_response(
            blood_request,
            donor_id,
            RequestResponse.ResponseStatus.ACCEPTED,
            {"name": "Jane", "blood_type": "O+", "phone": "+237600000000"},
        )

    blood_request.refresh_from_db()
    assert created is True
    assert first.donor_name == "Jane"
    assert blood_request.status == BloodRequest.Status.PARTIALLY_FULFILLED
    publish.assert_called_once()
    assert publish.call_args.args[0] == "DONOR_ACCEPTED_REQUEST"

    with patch("blood_requests.services.publish_event"):
        record_donor_response(blood_request, uuid.uuid4(), RequestResponse.ResponseStatus.ACCEPTED)
    blood_request.refresh_from_db()
    assert blood_request.status == BloodRequest.Status.MATCHED


@pytest.mark.django_db
def test_expire_open_requests_updates_expired_status(hospital_id):
    expired = BloodRequest.objects.create(
        hospital_id=hospital_id,
        hospital_name="Central Hospital",
        city="Douala",
        blood_type="A+",
        units_needed=1,
        expires_at=timezone.now() - timezone.timedelta(minutes=1),
    )
    current = BloodRequest.objects.create(
        hospital_id=hospital_id,
        hospital_name="Central Hospital",
        city="Douala",
        blood_type="A+",
        units_needed=1,
        expires_at=timezone.now() + timezone.timedelta(hours=1),
    )

    with patch("blood_requests.services.publish_event") as publish:
        assert expire_open_requests() == 1

    expired.refresh_from_db()
    current.refresh_from_db()
    assert expired.status == BloodRequest.Status.EXPIRED
    assert current.status == BloodRequest.Status.ACTIVE
    publish.assert_called_once_with("EMERGENCY_REQUESTS_EXPIRED", {"count": 1})


@pytest.mark.django_db
def test_request_views_create_respond_and_list_responses(api_client, hospital_id, donor_id):
    with patch("blood_requests.services._nearby_donors", return_value=[]), patch("blood_requests.services.publish_event"):
        created = api_client.post(
            "/api/requests/",
            {
                "hospital_id": str(hospital_id),
                "hospital_name": "Central Hospital",
                "city": "Yaounde",
                "blood_type": "B+",
                "units_needed": 1,
                "urgency": "HIGH",
                "latitude": "3.866700",
                "longitude": "11.516700",
            },
            format="json",
        )
    assert created.status_code == 201

    request_id = created.data["id"]
    with patch("blood_requests.services.publish_event"):
        response = api_client.post(
            f"/api/requests/{request_id}/respond/",
            {
                "donor_id": str(donor_id),
                "status": "ACCEPTED",
                "name": "Jane Donor",
                "blood_type": "B+",
            },
            format="json",
        )
    assert response.status_code == 200
    assert response.data["created"] is True

    responses = api_client.get(f"/api/requests/{request_id}/responses/")
    assert responses.status_code == 200
    assert responses.data[0]["donor_name"] == "Jane Donor"
