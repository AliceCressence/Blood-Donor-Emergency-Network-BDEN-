from django.core.management.base import BaseCommand

from donors.events import consume_events


class Command(BaseCommand):
    help = "Start the Redis event consumer for donor-service."

    def handle(self, *args, **options):
        self.stdout.write("Starting donor-service event consumer...")
        self.stdout.write("Subscribed to: DONATION_RECORDED")
        self.stdout.write("Press Ctrl+C to stop.")
        try:
            consume_events()
        except KeyboardInterrupt:
            self.stdout.write("Event consumer stopped.")
