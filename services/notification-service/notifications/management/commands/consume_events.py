import redis
from django.conf import settings
from django.core.management.base import BaseCommand

from notifications.events import handle_event


class Command(BaseCommand):
    help = "Consume BDEN Redis events and create notifications."

    def handle(self, *args, **options):
        client = redis.Redis.from_url(settings.REDIS_URL)
        pubsub = client.pubsub()
        pubsub.subscribe("bden.events")
        self.stdout.write(self.style.SUCCESS("notification-service listening on bden.events"))
        for event in pubsub.listen():
            if event.get("type") == "message":
                handle_event(event.get("data"))
