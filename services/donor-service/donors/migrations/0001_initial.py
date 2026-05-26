import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="DonorProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("user_id", models.UUIDField(db_index=True, unique=True)),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(blank=True, default="", max_length=100)),
                ("phone", models.CharField(blank=True, default="", max_length=20)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                ("blood_type", models.CharField(choices=[("A+", "A+"), ("A-", "A-"), ("B+", "B+"), ("B-", "B-"), ("AB+", "AB+"), ("AB-", "AB-"), ("O+", "O+"), ("O-", "O-"), ("UNKNOWN", "Unknown")], default="UNKNOWN", max_length=10)),
                ("blood_type_verified", models.BooleanField(default=False)),
                ("blood_type_estimated", models.CharField(blank=True, default="", max_length=100)),
                ("latitude", models.FloatField(blank=True, null=True)),
                ("longitude", models.FloatField(blank=True, null=True)),
                ("city", models.CharField(blank=True, default="", max_length=100)),
                ("region", models.CharField(blank=True, default="", max_length=100)),
                ("availability_status", models.CharField(choices=[("AVAILABLE", "Available"), ("UNAVAILABLE", "Unavailable"), ("BUSY", "Busy")], default="AVAILABLE", max_length=15)),
                ("last_donation_date", models.DateField(blank=True, null=True)),
                ("total_donations", models.PositiveIntegerField(default=0)),
                ("total_volume_ml", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "donor_profiles"},
        ),
        migrations.CreateModel(
            name="ScreeningCenter",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("facility_type", models.CharField(max_length=50)),
                ("address", models.CharField(blank=True, default="", max_length=255)),
                ("city", models.CharField(max_length=100)),
                ("region", models.CharField(blank=True, default="", max_length=100)),
                ("latitude", models.FloatField()),
                ("longitude", models.FloatField()),
                ("phone", models.CharField(blank=True, default="", max_length=20)),
                ("opening_hours", models.CharField(blank=True, default="", max_length=100)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "screening_centers"},
        ),
        migrations.CreateModel(
            name="VirtualDonorCard",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("card_number", models.CharField(blank=True, max_length=30, unique=True)),
                ("issued_at", models.DateTimeField(auto_now_add=True)),
                ("donor_profile", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="virtual_card", to="donors.donorprofile")),
            ],
            options={"db_table": "virtual_donor_cards"},
        ),
        migrations.CreateModel(
            name="DonationRecord",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("source_type", models.CharField(choices=[("EMERGENCY_REQUEST", "Emergency Request"), ("CAMPAIGN", "Campaign"), ("INDEPENDENT", "Independent")], max_length=20)),
                ("source_id", models.UUIDField(blank=True, null=True)),
                ("facility_name", models.CharField(max_length=255)),
                ("facility_user_id", models.UUIDField(blank=True, null=True)),
                ("volume_ml", models.PositiveIntegerField()),
                ("donation_date", models.DateField()),
                ("recorded_by_user_id", models.UUIDField()),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("donor_profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="donation_records", to="donors.donorprofile")),
            ],
            options={"db_table": "donation_records", "ordering": ["-donation_date"]},
        ),
        migrations.AddIndex(model_name="donorprofile", index=models.Index(fields=["user_id"], name="donor_profi_user_id_6a0b88_idx")),
        migrations.AddIndex(model_name="donorprofile", index=models.Index(fields=["blood_type", "availability_status"], name="donor_profi_blood_t_8de6d7_idx")),
        migrations.AddIndex(model_name="donorprofile", index=models.Index(fields=["city"], name="donor_profi_city_3eb088_idx")),
        migrations.AddIndex(model_name="screeningcenter", index=models.Index(fields=["city"], name="screening_c_city_e99e7c_idx")),
        migrations.AddIndex(model_name="screeningcenter", index=models.Index(fields=["is_active"], name="screening_c_is_acti_d5fb79_idx")),
        migrations.AddIndex(model_name="donationrecord", index=models.Index(fields=["donor_profile", "donation_date"], name="donation_re_donor__107d66_idx")),
        migrations.AddIndex(model_name="donationrecord", index=models.Index(fields=["source_type", "source_id"], name="donation_re_source__461c9d_idx")),
    ]
