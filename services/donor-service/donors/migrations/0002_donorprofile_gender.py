from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("donors", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="donorprofile",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[
                    ("MALE", "Male"),
                    ("FEMALE", "Female"),
                ],
                default="",
                max_length=20,
            ),
        ),
    ]
