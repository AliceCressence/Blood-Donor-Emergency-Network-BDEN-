from django.db import migrations, models


def normalize_gender(apps, schema_editor):
    DonorProfile = apps.get_model("donors", "DonorProfile")
    DonorProfile.objects.filter(gender="M").update(gender="MALE")
    DonorProfile.objects.filter(gender="F").update(gender="FEMALE")
    DonorProfile.objects.filter(gender__in=["OTHER", "PREFER_NOT_TO_SAY"]).update(gender="")


class Migration(migrations.Migration):
    dependencies = [
        ("donors", "0002_donorprofile_gender"),
    ]

    operations = [
        migrations.RunPython(normalize_gender, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="donorprofile",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[("MALE", "Male"), ("FEMALE", "Female")],
                default="",
                max_length=20,
            ),
        ),
    ]
