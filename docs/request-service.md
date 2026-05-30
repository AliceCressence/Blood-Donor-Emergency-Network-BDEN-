# Request Service

The request service owns emergency blood request lifecycle data. Hospitals create requests, donors respond, and internal services can pre-create donor response rows after matching.

## Service Scope

- Store emergency blood requests from hospitals.
- List active requests for donor discovery and dashboard views.
- Track donor responses as pending, accepted, declined, unavailable, or no-response.
- Publish Redis events when requests are created, cancelled, expired, or accepted by a donor.
- Keep compatibility with the first frontend integration while exposing the spec-aligned API.

## Models

- `BloodRequest`: hospital, location, blood type, units needed, urgency, status, notes, expiry, fulfilment, cancellation metadata.
- `RequestResponse`: a donor's response to a request, including optional donor snapshot fields and distance.
- `MatchingResult`: internal matching result rows used by donor/request matching workflows.

## Public API

Base path through the gateway: `/api/requests/`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/requests/` | Create an emergency request. |
| `GET` | `/api/requests/active/` | List active/open requests. Supports `city`, `blood_type`, and `status`. |
| `GET` | `/api/requests/{id}/` | Request detail. |
| `POST` | `/api/requests/{id}/respond/` | Donor response. Accepts `response_status` or legacy `status`. |
| `GET` | `/api/requests/{id}/responses/` | List donor responses for a request. |
| `POST` | `/api/requests/{id}/cancel/` | Cancel a request with optional `reason`. |
| `GET` | `/api/requests/mine/` | Authenticated hospital request list from JWT user id. |

Legacy aliases remain available:

- `POST /api/requests/create/`
- `PUT /api/requests/{id}/close/`
- `GET /api/requests/list/`

## Internal API

Internal endpoints require `X-Internal-API-Key`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/requests/{id}/responses/bulk/` | Create/update pending donor response rows after matching. |
| `GET` | `/api/requests/hospital/{hospital_id}/` | Internal hospital request listing. |

## Events

Events are published to Redis channel `bden.events`.

- `EMERGENCY_REQUEST_CREATED`
- `DONOR_ACCEPTED_REQUEST`
- `EMERGENCY_REQUEST_CANCELLED`
- `EMERGENCY_REQUESTS_EXPIRED`

Run the local event consumer with:

```bash
python manage.py consume_events
```

Docker Compose includes `request-event-consumer` for local development.

## API Docs

- Swagger: `/swagger/` on the request-service port, or via service routing when exposed.
- ReDoc: `/redoc/`

