import json

import redis
from django.conf import settings

NEARBY_CACHE_TTL = 300


def _get_client():
    return redis.from_url(settings.REDIS_CACHE_URL, decode_responses=True)


def _cache_key(blood_type, lat, lng, radius_km):
    return f"nearby:{blood_type}:{round(float(lat), 2)}:{round(float(lng), 2)}:{radius_km}"


def get_cached_nearby(blood_type, lat, lng, radius_km):
    try:
        raw = _get_client().get(_cache_key(blood_type, lat, lng, radius_km))
        return json.loads(raw) if raw else None
    except Exception:
        return None


def set_cached_nearby(blood_type, lat, lng, radius_km, user_ids):
    try:
        _get_client().setex(_cache_key(blood_type, lat, lng, radius_km), NEARBY_CACHE_TTL, json.dumps(user_ids))
    except Exception:
        pass


def invalidate_nearby_cache_for_city(_city):
    try:
        client = _get_client()
        for key in client.scan_iter("nearby:*"):
            client.delete(key)
    except Exception:
        pass
