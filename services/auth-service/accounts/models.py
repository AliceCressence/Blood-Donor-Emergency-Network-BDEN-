import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        DONOR = "DONOR", "Donor"
        HOSPITAL = "HOSPITAL", "Hospital"
        ADMIN = "ADMIN", "Admin"

    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    password = models.CharField(max_length=128, null=True, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices)
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True, default="")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    google_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    google_access_token = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["role"]

    objects = UserManager()

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role", "is_verified"]),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"

    def is_donor(self):
        return self.role == self.Role.DONOR

    def is_hospital(self):
        return self.role == self.Role.HOSPITAL

    def is_admin_user(self):
        return self.role == self.Role.ADMIN

    @property
    def auth_provider(self):
        return "google" if self.google_id else "email"


class HospitalRegistration(models.Model):
    class FacilityType(models.TextChoices):
        HOSPITAL = "HOSPITAL", "Hospital"
        CLINIC = "CLINIC", "Clinic"
        HEALTH_CENTER = "HEALTH_CENTER", "Health Center"
        MATERNITY = "MATERNITY", "Maternity Ward"
        NGO = "NGO", "NGO Health Facility"
        OTHER = "OTHER", "Other"

    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="hospital_registration")
    facility_name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=20, choices=FacilityType.choices)
    registration_number = models.CharField(max_length=100, unique=True)
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True, default="")
    contact_phone = models.CharField(max_length=20, blank=True, default="")
    verification_status = models.CharField(max_length=10, choices=VerificationStatus.choices, default=VerificationStatus.PENDING, db_index=True)
    rejection_reason = models.TextField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_hospitals")

    class Meta:
        db_table = "hospital_registrations"
        indexes = [models.Index(fields=["verification_status"])]

    def approve(self, admin_user):
        from django.utils import timezone

        self.verification_status = self.VerificationStatus.APPROVED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.rejection_reason = ""
        self.save(update_fields=["verification_status", "reviewed_by", "reviewed_at", "rejection_reason"])
        self.user.is_verified = True
        self.user.save(update_fields=["is_verified"])

    def reject(self, admin_user, reason):
        from django.utils import timezone

        self.verification_status = self.VerificationStatus.REJECTED
        self.rejection_reason = reason
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.save(update_fields=["verification_status", "rejection_reason", "reviewed_by", "reviewed_at"])
