from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[
                    ("MALE", "Male"),
                    ("FEMALE", "Female"),
                    ("OTHER", "Other"),
                    ("PREFER_NOT_TO_SAY", "Prefer not to say"),
                ],
                default="",
                max_length=20,
            ),
        ),
    ]
