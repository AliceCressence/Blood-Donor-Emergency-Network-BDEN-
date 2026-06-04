import json
import uuid

import pytest
from django.conf import settings
from rest_framework.test import APIClient

from .events import handle_event
from .models import Notification, NotificationPreference
from .services import create_notification, get_preferences, mark_notifications_read, unread_count


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def notification(user_id):
    return Notification.objects.create(
        user_id=user_id,
        type=Notification.NotificationType.EMERGENCY,
        title="Emergency nearby",
        body="A facility needs blood.",
        data={"request_id": "req-1"},
    )


@pytest.mark.django_db
def test_create_notification_and_unread_count(user_id):
    notification = create_notification(
        user_id=user_id,
        type=Notification.NotificationType.SYSTEM,
        title="Welcome",
        body="Your account is ready.",
        data={"kind": "onboarding"},
    )

    assert notification.id
    assert unread_count(user_id) == 1


@pytest.mark.django_db
def test_mark_notifications_read(user_id, notification):
    other = Notification.objects.create(
        user_id=user_id,
        type=Notification.NotificationType.CAMPAIGN,
        title="Campaign",
        body="A campaign is nearby.",
    )

    assert mark_notifications_read(user_id, [notification.id]) == 1
    notification.refresh_from_db()
    other.refresh_from_db()
    assert notification.read is True
    assert other.read is False

    assert mark_notifications_read(user_id, mark_all=True) == 1
    assert unread_count(user_id) == 0


@pytest.mark.django_db
def test_get_preferences_is_idempotent(user_id):
    first = get_preferences(user_id)
    second = get_preferences(user_id)

    assert first.id == second.id
    assert NotificationPreference.objects.filter(user_id=user_id).count() == 1


@pytest.mark.django_db
def test_internal_create_notification_requires_api_key(api_client, user_id):
    payload = {
        "user_id": str(user_id),
        "type": "SYSTEM",
        "title": "System note",
        "body": "Hello",
        "data": {"source": "test"},
    }

    rejected = api_client.post("/api/notifications/create/", payload, format="json")
    assert rejected.status_code == 403

    created = api_client.post(
        "/api/notifications/create/",
        payload,
        HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY,
        format="json",
    )
    assert created.status_code == 201
    assert Notification.objects.filter(user_id=user_id, title="System note").exists()


@pytest.mark.django_db
def test_notification_list_and_mark_read_batch(api_client, user_id, notification):
    Notification.objects.create(
        user_id=user_id,
        type=Notification.NotificationType.CAMPAIGN,
        title="Campaign",
        body="A campaign is nearby.",
        read=True,
    )

    listed = api_client.get(f"/api/notifications/?user_id={user_id}&unread=true")
    assert listed.status_code == 200
    assert listed.data["unread_count"] == 1
    assert len(listed.data["notifications"]) == 1

    marked = api_client.post(
        "/api/notifications/mark-read/",
        {"user_id": str(user_id), "notification_ids": [str(notification.id)]},
        format="json",
    )
    assert marked.status_code == 200
    assert marked.data["marked_read"] == 1
    assert marked.data["unread_count"] == 0


@pytest.mark.django_db
def test_bulk_create_notifications(api_client):
    users = [uuid.uuid4(), uuid.uuid4()]

    response = api_client.post(
        "/api/notifications/bulk/",
        {
            "user_ids": [str(user_id) for user_id in users],
            "type": "CAMPAIGN",
            "title": "Drive nearby",
            "body": "A new campaign is open.",
        },
        HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY,
        format="json",
    )

    assert response.status_code == 201
    assert response.data["created"] == 2
    assert Notification.objects.filter(type="CAMPAIGN").count() == 2


@pytest.mark.django_db
def test_handle_emergency_request_created_event_targets_donor(user_id):
    handle_event(json.dumps({
        "type": "EMERGENCY_REQUEST_CREATED",
        "payload": {
            "donor_id": str(user_id),
            "hospital_name": "Central Hospital",
            "blood_type": "O+",
        },
    }))

    notification = Notification.objects.get(user_id=user_id)
    assert notification.type == Notification.NotificationType.EMERGENCY
    assert "Central Hospital" in notification.body


@pytest.mark.django_db
def test_handle_campaign_approved_event_creates_notifications_for_nearby_donors():
    donors = [uuid.uuid4(), uuid.uuid4()]

    created = handle_event(json.dumps({
        "type": "CAMPAIGN_APPROVED",
        "payload": {
            "campaign_id": str(uuid.uuid4()),
            "hospital_name": "Central Hospital",
            "title": "Weekend drive",
            "nearby_donors": [
                {"user_id": str(donors[0]), "distance_km": 3.4},
                {"id": str(donors[1]), "distance_km": 6.1},
                {"distance_km": 9.0},
            ],
        },
    }))

    assert len(created) == 2
    assert Notification.objects.filter(type=Notification.NotificationType.CAMPAIGN).count() == 2


@pytest.mark.django_db
def test_handle_hospital_facing_donor_action_events():
    hospital_id = uuid.uuid4()

    handle_event(json.dumps({
        "type": "DONOR_ACCEPTED_REQUEST",
        "payload": {
            "hospital_id": str(hospital_id),
            "request_id": str(uuid.uuid4()),
            "donor_id": str(uuid.uuid4()),
        },
    }))
    handle_event(json.dumps({
        "type": "DONOR_INTERESTED_CAMPAIGN",
        "payload": {
            "hospital_user_id": str(hospital_id),
            "campaign_id": str(uuid.uuid4()),
            "title": "Weekend drive",
        },
    }))

    assert Notification.objects.filter(user_id=hospital_id).count() == 2
