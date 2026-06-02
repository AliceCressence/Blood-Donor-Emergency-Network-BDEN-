import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="DonorDashboardBanner",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=120)),
                ("image_url", models.URLField(max_length=1000)),
                ("alt_text", models.CharField(blank=True, default="", max_length=180)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_by", models.UUIDField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "donor_dashboard_banners",
                "ordering": ["-is_active", "-updated_at"],
            },
        ),
    ]
