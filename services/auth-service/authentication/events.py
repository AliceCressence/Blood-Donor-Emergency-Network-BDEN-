import json
import logging

import redis
from django.conf import settings

logger = logging.getLogger(__name__)


def publish_event(channel: str, data: dict):
    payload = json.dumps(data, default=str)
    try:
        client = redis.Redis.from_url(settings.REDIS_URL)
        client.publish(channel, payload)
    except redis.RedisError as exc:
        logger.warning("Could not publish %s event: %s", channel, exc)
