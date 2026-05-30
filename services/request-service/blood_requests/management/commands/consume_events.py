import json

import redis
from django.conf import settings
from django.core.management.base import BaseCommand

from blood_requests.events import handle_event


class Command(BaseCommand):
    help = "Consume BDEN Redis events for the request service."

    def handle(self, *args, **options):
        client = redis.Redis.from_url(settings.REDIS_URL)
        pubsub = client.pubsub()
        pubsub.subscribe("bden.events")
        self.stdout.write(self.style.SUCCESS("request-service listening on bden.events"))
        for event in pubsub.listen():
            if event.get("type") != "message":
                continue
            payload = event.get("data")
            try:
                payload = payload.decode("utf-8")
                message = json.loads(payload)
            except (AttributeError, ValueError, TypeError):
                message = payload
            handle_event(message)
