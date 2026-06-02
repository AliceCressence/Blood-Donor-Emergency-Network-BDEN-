from django.utils import timezone
from django.conf import settings
import requests

from .events import publish_event
from .models import BloodRequest, MatchingResult, RequestResponse


def create_request(validated_data):
    blood_request = BloodRequest.objects.create(**validated_data)
    payload = {
        "request_id": str(blood_request.id),
        "blood_type": blood_request.blood_type,
        "city": blood_request.city,
        "units_needed": blood_request.units_needed,
        "urgency": blood_request.urgency,
        "hospital_id": str(blood_request.hospital_id),
        "hospital_name": blood_request.hospital_name,
        "latitude": str(blood_request.latitude) if blood_request.latitude is not None else None,
        "longitude": str(blood_request.longitude) if blood_request.longitude is not None else None,
    }
    matched_donors = _nearby_donors(blood_request)
    if matched_donors:
        store_matching_results(blood_request, matched_donors)
        for donor in matched_donors:
            publish_event("EMERGENCY_REQUEST_CREATED", {**payload, "donor_id": donor.get("user_id") or donor.get("id"), "distance_km": donor.get("distance_km")})
    else:
        publish_event("EMERGENCY_REQUEST_CREATED", payload)
    return blood_request


def _nearby_donors(blood_request):
    if blood_request.latitude is None or blood_request.longitude is None:
        return []
    try:
        response = requests.get(
            f"{settings.DONOR_SERVICE_URL}/internal/donors/nearby/",
            params={
                "blood_type": blood_request.blood_type,
                "lat": blood_request.latitude,
                "lng": blood_request.longitude,
            },
            headers={"X-Internal-API-Key": settings.INTERNAL_API_KEY},
            timeout=3,
        )
        response.raise_for_status()
    except requests.RequestException:
        return []
    return response.json().get("donors", [])


def record_donor_response(blood_request, donor_id, response_status, donor_data=None):
    donor_data = donor_data or {}
    response_obj, created = RequestResponse.objects.update_or_create(
        request=blood_request,
        donor_id=donor_id,
        defaults={
            "status": response_status,
            "donor_name": donor_data.get("name", ""),
            "donor_blood_type": donor_data.get("blood_type", ""),
            "donor_phone": donor_data.get("phone", ""),
            "distance_km": donor_data.get("distance_km"),
        },
    )

    if response_status == RequestResponse.ResponseStatus.ACCEPTED:
        accepted_count = blood_request.responses.filter(status=response_status).count()
        if accepted_count >= blood_request.units_needed:
            blood_request.status = BloodRequest.Status.MATCHED
        elif accepted_count > 0:
            blood_request.status = BloodRequest.Status.PARTIALLY_FULFILLED
        blood_request.save(update_fields=["status"])
        publish_event(
            "DONOR_ACCEPTED_REQUEST",
            {
                "request_id": str(blood_request.id),
                "donor_id": str(donor_id),
                "hospital_id": str(blood_request.hospital_id),
            },
        )

    return response_obj, created


def cancel_request(blood_request, reason=""):
    blood_request.status = BloodRequest.Status.CANCELLED
    blood_request.cancellation_reason = reason
    blood_request.cancelled_at = timezone.now()
    blood_request.save(update_fields=["status", "cancellation_reason", "cancelled_at"])
    publish_event(
        "EMERGENCY_REQUEST_CANCELLED",
        {"request_id": str(blood_request.id), "reason": reason},
    )
    return blood_request


def expire_open_requests():
    now = timezone.now()
    qs = BloodRequest.objects.filter(
        status__in=[
            BloodRequest.Status.ACTIVE,
            BloodRequest.Status.OPEN,
            BloodRequest.Status.PARTIALLY_FULFILLED,
        ],
        expires_at__isnull=False,
        expires_at__lte=now,
    )
    count = qs.update(status=BloodRequest.Status.EXPIRED)
    if count:
        publish_event("EMERGENCY_REQUESTS_EXPIRED", {"count": count})
    return count


def store_matching_results(blood_request, donors):
    results = []
    for donor in donors:
        donor_id = donor.get("donor_id") or donor.get("user_id") or donor.get("id")
        if not donor_id:
            continue
        result, _created = MatchingResult.objects.update_or_create(
            request=blood_request,
            donor_id=donor_id,
            defaults={
                "distance_km": donor.get("distance_km"),
                "compatibility_score": donor.get("compatibility_score", 0),
            },
        )
        results.append(result)
    return results
