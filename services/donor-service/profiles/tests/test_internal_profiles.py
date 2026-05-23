import uuid

import pytest
from django.conf import settings
from rest_framework.test import APIClient

from profiles.models import DonorProfile


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
def test_create_profile_requires_internal_key(client):
    res = client.post("/internal/donors/create-profile/", {"user_id": str(uuid.uuid4()), "first_name": "Jean"}, format="json")
    assert res.status_code == 403


@pytest.mark.django_db
def test_create_profile_with_valid_internal_key(client):
    user_id = str(uuid.uuid4())
    res = client.post(
        "/internal/donors/create-profile/",
        {"user_id": user_id, "first_name": "Jean", "last_name": "Mbarga", "city": "Yaounde"},
        HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY,
        format="json",
    )
    assert res.status_code == 201
    assert DonorProfile.objects.filter(user_id=user_id).exists()


@pytest.mark.django_db
def test_duplicate_profile_is_idempotent(client):
    user_id = uuid.uuid4()
    DonorProfile.objects.create(user_id=user_id, first_name="Jean")
    res = client.post(
        "/internal/donors/create-profile/",
        {"user_id": str(user_id), "first_name": "Jean"},
        HTTP_X_INTERNAL_API_KEY=settings.INTERNAL_API_KEY,
        format="json",
    )
    assert res.status_code == 200
    assert res.data["created"] is False
