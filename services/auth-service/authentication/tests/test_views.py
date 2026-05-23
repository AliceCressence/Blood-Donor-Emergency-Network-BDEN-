import pytest
from rest_framework.test import APIClient
from unittest.mock import patch

from accounts.models import HospitalRegistration, User


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def donor(db):
    return User.objects.create_user(email="donor@test.com", password="StrongPass123", role=User.Role.DONOR, is_verified=True)


@pytest.fixture
def admin(db):
    return User.objects.create_user(email="admin@bden.cm", password="AdminPass123", role=User.Role.ADMIN, is_verified=True, is_staff=True)


@pytest.fixture
def pending_hospital(db):
    user = User.objects.create_user(email="clinic@test.com", password="ClinicPass123", role=User.Role.HOSPITAL, is_verified=False)
    HospitalRegistration.objects.create(
        user=user,
        facility_name="Yaounde Central Clinic",
        facility_type=HospitalRegistration.FacilityType.CLINIC,
        registration_number="CM-REG-2024-001",
        city="Yaounde",
    )
    return user


@pytest.mark.django_db
class TestDonorRegister:
    @patch("authentication.services.DonorRegistrationService._create_donor_profile")
    def test_successful_registration_returns_tokens(self, mock_profile, client):
        mock_profile.return_value = True
        res = client.post(
            "/api/auth/register/donor/",
            {"email": "new@test.com", "password": "StrongPass123", "first_name": "Jean", "last_name": "Mbarga", "city": "Yaounde"},
            format="json",
        )
        assert res.status_code == 201
        assert "access" in res.data
        assert "refresh" in res.data
        assert res.data["user"]["role"] == "donor"

    def test_duplicate_email_rejected(self, client, donor):
        res = client.post(
            "/api/auth/register/donor/",
            {"email": donor.email, "password": "StrongPass123", "first_name": "Jean", "city": "Yaounde"},
            format="json",
        )
        assert res.status_code == 400
        assert "email" in res.data

    def test_numeric_password_rejected(self, client):
        res = client.post(
            "/api/auth/register/donor/",
            {"email": "new@test.com", "password": "12345678", "first_name": "Jean", "city": "Yaounde"},
            format="json",
        )
        assert res.status_code == 400
        assert "password" in res.data

    @patch("authentication.services.DonorRegistrationService._create_donor_profile")
    def test_profile_failure_rolls_back_user(self, mock_profile, client):
        mock_profile.return_value = False
        res = client.post(
            "/api/auth/register/donor/",
            {"email": "rollback@test.com", "password": "StrongPass123", "first_name": "Jean", "city": "Yaounde"},
            format="json",
        )
        assert res.status_code == 500
        assert not User.objects.filter(email="rollback@test.com").exists()


@pytest.mark.django_db
class TestHospitalRegister:
    def test_hospital_registration_is_pending(self, client):
        res = client.post(
            "/api/auth/register/hospital/",
            {
                "email": "hospital@test.com",
                "password": "Hospital123",
                "facility_name": "Central Hospital",
                "facility_type": "HOSPITAL",
                "registration_number": "HOSP-001",
                "city": "Yaounde",
            },
            format="json",
        )
        assert res.status_code == 201
        user = User.objects.get(email="hospital@test.com")
        assert user.is_verified is False
        assert user.hospital_registration.verification_status == "PENDING"


@pytest.mark.django_db
class TestLogin:
    def test_donor_can_login(self, client, donor):
        res = client.post("/api/auth/login/", {"email": donor.email, "password": "StrongPass123"}, format="json")
        assert res.status_code == 200
        assert "access" in res.data
        assert res.data["user"]["role"] == "donor"

    def test_unverified_hospital_cannot_login(self, client, pending_hospital):
        res = client.post("/api/auth/login/", {"email": pending_hospital.email, "password": "ClinicPass123"}, format="json")
        assert res.status_code == 400

    def test_logout_requires_refresh_token(self, client, donor):
        client.force_authenticate(user=donor)
        res = client.post("/api/auth/logout/", {}, format="json")
        assert res.status_code == 400


@pytest.mark.django_db
class TestAdminVerification:
    def test_pending_hospitals_list(self, client, admin, pending_hospital):
        client.force_authenticate(user=admin)
        res = client.get("/api/admin/hospitals/pending/")
        assert res.status_code == 200
        assert len(res.data["results"]) == 1

    def test_admin_can_approve_hospital(self, client, admin, pending_hospital):
        client.force_authenticate(user=admin)
        res = client.post(f"/api/admin/hospitals/{pending_hospital.id}/verify/", {"action": "approve"}, format="json")
        assert res.status_code == 200
        pending_hospital.refresh_from_db()
        assert pending_hospital.is_verified is True

    def test_reject_requires_reason(self, client, admin, pending_hospital):
        client.force_authenticate(user=admin)
        res = client.post(f"/api/admin/hospitals/{pending_hospital.id}/verify/", {"action": "reject"}, format="json")
        assert res.status_code == 400
