from django.core.management.base import BaseCommand

from donors.models import ScreeningCenter

INITIAL_CENTERS = [
    {"name": "Hopital Central de Yaounde", "facility_type": "Public Hospital", "address": "Rue Henri Dunant", "city": "Yaounde", "region": "Centre", "latitude": 3.8667, "longitude": 11.5167, "phone": "+237222231234", "opening_hours": "Mon-Fri 7h30-15h30"},
    {"name": "Hopital General de Douala", "facility_type": "Public Hospital", "address": "Boulevard de la Republique", "city": "Douala", "region": "Littoral", "latitude": 4.0511, "longitude": 9.7679, "phone": "+237233421234", "opening_hours": "Mon-Fri 7h30-15h30"},
    {"name": "Centre National de Transfusion Sanguine", "facility_type": "Blood Bank", "address": "Avenue Kennedy, Yaounde", "city": "Yaounde", "region": "Centre", "latitude": 3.8700, "longitude": 11.5100, "phone": "+237222201111", "opening_hours": "Mon-Sat 7h-17h"},
    {"name": "Hopital Laquintinie de Douala", "facility_type": "Public Hospital", "address": "Avenue des Cocotiers", "city": "Douala", "region": "Littoral", "latitude": 4.0600, "longitude": 9.7500, "phone": "+237233421000", "opening_hours": "Mon-Fri 7h-16h"},
    {"name": "Hopital Regional de Bafoussam", "facility_type": "Public Hospital", "address": "Quartier Famla", "city": "Bafoussam", "region": "Ouest", "latitude": 5.4781, "longitude": 10.4178, "phone": "+237233441234", "opening_hours": "Mon-Fri 7h30-15h30"},
]


class Command(BaseCommand):
    help = "Seeds initial screening center data for Cameroon."

    def handle(self, *args, **options):
        created = 0
        for data in INITIAL_CENTERS:
            _, was_created = ScreeningCenter.objects.get_or_create(name=data["name"], city=data["city"], defaults=data)
            if was_created:
                created += 1
        self.stdout.write(f"Seeded {created} new screening centers.")
