import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("donors", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="BloodTypeEstimationSession",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("messages", models.JSONField(default=list)),
                ("estimation_result", models.CharField(blank=True, default="", max_length=200)),
                ("confidence_note", models.TextField(blank=True, default="")),
                ("completed", models.BooleanField(db_index=True, default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("donor_profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="estimation_sessions", to="donors.donorprofile")),
            ],
            options={"db_table": "estimation_sessions", "ordering": ["-created_at"]},
        )
    ]
