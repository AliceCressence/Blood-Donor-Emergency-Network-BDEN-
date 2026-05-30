import json
import logging

import redis
from django.conf import settings

from .services import create_notification

logger = logging.getLogger(__name__)


def handle_event(raw_message):
    try:
        message = json.loads(raw_message)
    except (TypeError, ValueError):
        logger.warning("Ignoring malformed notification event: %s", raw_message)
        return None

    event_type = message.get("type")
    payload = message.get("payload", {})
    if event_type == "EMERGENCY_REQUEST_CREATED":
        return create_notification(
            user_id=payload["donor_id"],
            type="EMERGENCY",
            title="Emergency blood request nearby",
            body=f"{payload.get('hospital_name', 'A hospital')} needs {payload.get('blood_type', 'blood')}.",
            data=payload,
        ) if payload.get("donor_id") else None
    return None


def listen_for_events():
    client = redis.Redis.from_url(settings.REDIS_URL)
    pubsub = client.pubsub()
    pubsub.subscribe("bden.events")
    for event in pubsub.listen():
        if event.get("type") == "message":
            handle_event(event.get("data"))
