from django.db import migrations, models


def normalize_gender(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(gender__in=["OTHER", "PREFER_NOT_TO_SAY"]).update(gender="")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_user_gender"),
    ]

    operations = [
        migrations.RunPython(normalize_gender, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[("MALE", "Male"), ("FEMALE", "Female")],
                default="",
                max_length=20,
            ),
        ),
    ]
