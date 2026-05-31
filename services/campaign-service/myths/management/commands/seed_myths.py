from django.core.management.base import BaseCommand

from myths.models import MythArticle

SENTINEL_ADMIN_ID = "00000000-0000-0000-0000-000000000001"

INITIAL_MYTHS = [
    {
        "title": "Does blood donation make you weak?",
        "myth_statement": "Donating blood causes permanent weakness and will leave you bedridden for days.",
        "truth_statement": "A healthy adult's body replaces donated plasma quickly, and most donors feel normal within a few hours when they hydrate and eat well.",
        "source": "WHO Blood Safety Guidelines 2020",
        "category": "HEALTH",
    },
    {
        "title": "Can you get a disease from donating blood?",
        "myth_statement": "You can catch HIV or other infections from donating blood.",
        "truth_statement": "Donation centres use a new, sterile, single-use needle for each donor, so donation itself does not expose you to infection.",
        "source": "WHO Blood Safety Guidelines 2020",
        "category": "PROCEDURAL",
    },
    {
        "title": "Is blood donation painful?",
        "myth_statement": "Blood donation is a painful and unpleasant procedure.",
        "truth_statement": "Most donors feel only a brief pinch when the needle is inserted. The actual donation is usually comfortable and takes only a few minutes.",
        "source": "Cameroon National Blood Transfusion Centre",
        "category": "PROCEDURAL",
    },
    {
        "title": "Can people with medication never donate?",
        "myth_statement": "If you take medication or have a health condition, you can never donate blood.",
        "truth_statement": "Eligibility depends on the condition and medication. A screening nurse can assess your situation, so it is better to ask than to self-disqualify.",
        "source": "WHO Donor Selection Guidelines",
        "category": "ELIGIBILITY",
    },
    {
        "title": "Is blood donation forbidden by religion?",
        "myth_statement": "My religion prohibits blood donation.",
        "truth_statement": "Many religious leaders consider voluntary life-saving blood donation an act of charity and compassion.",
        "source": "WHO Global Blood Programme",
        "category": "RELIGIOUS",
    },
    {
        "title": "Do only certain people need to donate?",
        "myth_statement": "Blood donation is only necessary during disasters.",
        "truth_statement": "Hospitals need safe blood every day for surgery, childbirth complications, accidents, cancer care, and sickle cell disease.",
        "source": "Cameroon Ministry of Public Health",
        "category": "CULTURAL",
    },
    {
        "title": "Will donating blood affect my physical performance?",
        "myth_statement": "Athletes and active people should not donate blood because it will hurt performance.",
        "truth_statement": "Avoid intense exercise for about 24 hours after donating. After that rest period, most healthy donors return to normal activity.",
        "source": "WHO Blood Safety Guidelines 2020",
        "category": "HEALTH",
    },
]


class Command(BaseCommand):
    help = "Seeds initial myth-debunking articles for BDEN."

    def handle(self, *args, **options):
        created = 0
        for data in INITIAL_MYTHS:
            _article, was_created = MythArticle.objects.get_or_create(
                title=data["title"],
                defaults={**data, "created_by": SENTINEL_ADMIN_ID},
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new myth articles."))
