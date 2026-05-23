import uuid

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
                ("city", models.CharField(blank=True, default="", max_length=100)),
                ("blood_type", models.CharField(blank=True, default="", max_length=3)),
                ("blood_type_status", models.CharField(choices=[("UNKNOWN", "Unknown"), ("ESTIMATED", "Estimated"), ("VERIFIED", "Verified")], default="UNKNOWN", max_length=10)),
                ("is_available", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "donor_profiles",
                "indexes": [models.Index(fields=["user_id"], name="donor_profi_user_id_6a0b88_idx"), models.Index(fields=["city", "is_available"], name="donor_profi_city_c4c829_idx")],
            },
        ),
    ]
