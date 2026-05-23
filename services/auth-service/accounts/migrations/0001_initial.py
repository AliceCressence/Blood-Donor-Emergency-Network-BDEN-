import uuid

import django.db.models.deletion
from django.db import migrations, models

import accounts.managers


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("password", models.CharField(blank=True, max_length=128, null=True)),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("email", models.EmailField(db_index=True, max_length=254, unique=True)),
                ("role", models.CharField(choices=[("DONOR", "Donor"), ("HOSPITAL", "Hospital"), ("ADMIN", "Admin")], max_length=10)),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                ("is_verified", models.BooleanField(default=False)),
                ("google_id", models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ("google_access_token", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("groups", models.ManyToManyField(blank=True, related_name="user_set", related_query_name="user", to="auth.group")),
                ("user_permissions", models.ManyToManyField(blank=True, related_name="user_set", related_query_name="user", to="auth.permission")),
            ],
            options={
                "db_table": "users",
                "indexes": [models.Index(fields=["email"], name="users_email_5f089e_idx"), models.Index(fields=["role", "is_verified"], name="users_role_45c0db_idx")],
            },
            managers=[
                ("objects", accounts.managers.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name="HospitalRegistration",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("facility_name", models.CharField(max_length=255)),
                ("facility_type", models.CharField(choices=[("HOSPITAL", "Hospital"), ("CLINIC", "Clinic"), ("HEALTH_CENTER", "Health Center"), ("MATERNITY", "Maternity Ward"), ("NGO", "NGO Health Facility"), ("OTHER", "Other")], max_length=20)),
                ("registration_number", models.CharField(max_length=100, unique=True)),
                ("address", models.TextField(blank=True, default="")),
                ("city", models.CharField(max_length=100)),
                ("region", models.CharField(blank=True, default="", max_length=100)),
                ("contact_phone", models.CharField(blank=True, default="", max_length=20)),
                ("verification_status", models.CharField(choices=[("PENDING", "Pending Review"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")], db_index=True, default="PENDING", max_length=10)),
                ("rejection_reason", models.TextField(blank=True, null=True)),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_hospitals", to="accounts.user")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="hospital_registration", to="accounts.user")),
            ],
            options={
                "db_table": "hospital_registrations",
                "indexes": [models.Index(fields=["verification_status"], name="hospital_re_verific_d6dabf_idx")],
            },
        ),
    ]
