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
    if event_type == "CAMPAIGN_APPROVED":
        created = []
        for donor in payload.get("nearby_donors", []):
            donor_id = donor.get("user_id") or donor.get("id")
            if not donor_id:
                continue
            created.append(create_notification(
                user_id=donor_id,
                type="CAMPAIGN",
                title="Donation campaign near you",
                body=f"{payload.get('hospital_name', 'A hospital')} is running: {payload.get('title', 'a donation campaign')}.",
                data={**payload, "donor_id": donor_id, "distance_km": donor.get("distance_km")},
            ))
        return created
    if event_type == "DONOR_ACCEPTED_REQUEST":
        return create_notification(
            user_id=payload["hospital_id"],
            type="EMERGENCY",
            title="A donor accepted your request",
            body="A donor has said they can help with your emergency request.",
            data=payload,
        ) if payload.get("hospital_id") else None
    if event_type == "DONOR_INTERESTED_CAMPAIGN":
        return create_notification(
            user_id=payload["hospital_user_id"],
            type="CAMPAIGN",
            title="A donor is interested in your campaign",
            body=f"A donor joined the campaign: {payload.get('title', 'Donation campaign')}.",
            data=payload,
        ) if payload.get("hospital_user_id") else None
    return None


def listen_for_events():
    client = redis.Redis.from_url(settings.REDIS_URL)
    pubsub = client.pubsub()
    pubsub.subscribe("bden.events")
    for event in pubsub.listen():
        if event.get("type") == "message":
            handle_event(event.get("data"))
