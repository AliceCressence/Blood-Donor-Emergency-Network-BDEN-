import json
import logging

import redis
from django.conf import settings

from .models import DonorProfile
from .services import DonorProfileService

logger = logging.getLogger(__name__)


def get_redis_client():
    return redis.from_url(settings.REDIS_URL, decode_responses=True)


def publish_event(channel, data):
    try:
        get_redis_client().publish(channel, json.dumps(data, default=str))
    except redis.RedisError as exc:
        logger.warning("Could not publish %s event: %s", channel, exc)


def handle_donation_recorded(data):
    try:
        profile = DonorProfile.objects.get(user_id=data["donor_user_id"])
        DonorProfileService().record_donation(
            donor_profile_id=profile.id,
            source_type=data["source_type"],
            source_id=data.get("source_id"),
            facility_name=data["facility_name"],
            facility_user_id=data.get("facility_user_id"),
            volume_ml=data["volume_ml"],
            donation_date=data["donation_date"],
            recorded_by_user_id=data["recorded_by_user_id"],
            notes=data.get("notes", ""),
        )
        logger.info("Donation recorded for donor %s", data["donor_user_id"])
    except Exception as exc:
        logger.error("Failed to handle DONATION_RECORDED event: %s", exc)


def consume_events():
    pubsub = get_redis_client().pubsub()
    pubsub.subscribe("DONATION_RECORDED")
    for message in pubsub.listen():
        if message["type"] != "message":
            continue
        handle_donation_recorded(json.loads(message["data"]))
