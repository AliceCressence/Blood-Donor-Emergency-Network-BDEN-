import json
import logging

import redis
from django.conf import settings

logger = logging.getLogger(__name__)


def publish_event(event_type, payload):
    message = {"type": event_type, "payload": payload}
    try:
        client = redis.Redis.from_url(settings.REDIS_URL)
        client.publish("bden.events", json.dumps(message, default=str))
    except Exception:
        logger.exception("Unable to publish request-service event %s", event_type)


def handle_event(message):
    logger.info("request-service received event: %s", message)
