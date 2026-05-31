import uuid

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from myths.models import MythArticle


def admin_client():
    token = AccessToken()
    token["user_id"] = str(uuid.uuid4())
    token["role"] = "ADMIN"
    token["is_verified"] = True
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.mark.django_db
def test_public_myths_hide_unpublished():
    MythArticle.objects.create(title="Published", myth_statement="Myth", truth_statement="Truth", category="HEALTH", created_by=uuid.uuid4())
    MythArticle.objects.create(title="Draft", myth_statement="Myth", truth_statement="Truth", category="HEALTH", is_published=False, created_by=uuid.uuid4())
    res = APIClient().get("/api/myths/")
    assert res.status_code == 200
    assert len(res.data) == 1


@pytest.mark.django_db
def test_admin_can_create_myth():
    res = admin_client().post(
        "/api/myths/create/",
        {"title": "Safe donation", "myth_statement": "Donation is unsafe", "truth_statement": "Sterile equipment keeps donors safe.", "category": "PROCEDURAL"},
        format="json",
    )
    assert res.status_code == 201
    assert res.data["title"] == "Safe donation"
