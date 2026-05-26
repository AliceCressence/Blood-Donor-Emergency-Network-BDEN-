# Donor Service

The donor-service owns donor profile data, donation history, virtual donor cards, screening centers, nearby donor matching, and the MVP blood-type estimation chat.

## Models

- `DonorProfile`: one row per auth-service donor user. The table name remains `donor_profiles`.
- `DonationRecord`: historical donations recorded by hospitals/admins.
- `VirtualDonorCard`: generated BDEN donor card with donation count and eligibility information.
- `ScreeningCenter`: public list of approved blood screening centers.
- `BloodTypeEstimationSession`: chat session used by the MVP blood-type estimation stub.

## Authentication

Public donor APIs require the SimpleJWT access token issued by auth-service. The donor-service validates those tokens with `AUTH_SECRET_KEY` and expects these claims:

- `user_id`
- `role`
- `is_verified`

Internal APIs require `X-Internal-API-Key` and are not included in public Swagger docs.

## Public APIs

```text
GET   /api/donors/me/
PATCH /api/donors/me/
PATCH /api/donors/me/blood-type/
POST  /api/donors/me/toggle-availability/
GET   /api/donors/me/card/
GET   /api/donors/me/donations/
POST  /api/donors/donations/record/
GET   /api/donors/screening-centers/
POST  /api/estimation/chat/
GET   /api/estimation/session/
```

Gateway documentation:

```text
http://localhost:8080/api/donor/docs/
http://localhost:8080/api/donor/redoc/
```

Direct service documentation:

```text
http://localhost:8002/api/docs/
http://localhost:8002/api/redoc/
```

## Internal APIs

```text
POST /internal/donors/create-profile/
GET  /internal/donors/nearby/
```

`create-profile` is called by auth-service after donor registration. `nearby` is for request-service matching and returns compatible, available donors ordered by distance.

## Matching

Nearby matching uses latitude/longitude, compatible blood type rules, donor availability, eligibility, and a configurable radius:

```text
DEFAULT_MATCHING_RADIUS_KM=30
MAX_MATCHING_RADIUS_KM=100
```

## Estimation

The estimation API stores a chat session and returns deterministic MVP responses. `GEMINI_API_KEY` and `GEMINI_MODEL_NAME` are already wired as placeholders for a V2 Gemini implementation.

## Events

The `consume_events` management command subscribes to Redis donor events. The MVP handler supports `DONATION_RECORDED` and records it in donor history.

```bash
docker compose up donor-event-consumer
```

## Seed Data

Seed local screening centers:

```bash
docker compose run --rm donor-service python manage.py seed_screening_centers
```

## MVP Schema Reset

The previous lightweight `profiles` app has been retired. Because no production donor database exists yet, local developers with old donor data should reset the donor volume before migrating:

```bash
docker compose down
docker volume rm blood-donor-emergency-network-bden-_donor_db_data
docker compose up --build donor-service
```

WhiteNoise is configured directly in each Django service; the old `apply_whitenoise.py` helper has been removed.
