# Campaign Service

The campaign service owns BDEN donation campaigns and myth-debunking articles. It is intentionally backend-focused: hospitals submit campaigns, admins review them, donors discover approved campaigns, and public readers can browse medically reviewed myth content.

## Responsibilities

- Donation campaign creation, review, cancellation, progress reporting, nearby discovery, and donor interest.
- Myth-debunking article publishing for public education.
- Redis event publishing for campaign lifecycle events.
- Swagger/ReDoc API documentation.
- Django Unfold admin for operational review and content management.

## Service URLs

Local direct service:

- `http://localhost:8004/health/`
- `http://localhost:8004/api/docs/`
- `http://localhost:8004/api/redoc/`

Through the gateway:

- `http://localhost:8000/api/campaigns/`
- `http://localhost:8000/api/myths/`
- `http://localhost:8000/api/campaign/docs/`
- `http://localhost:8000/health/campaign/`

## Campaign Endpoints

- `GET /api/campaigns/`
  Public list of approved/ongoing campaigns. Supports `city` and `blood_type`.

- `POST /api/campaigns/`
  Verified hospital only. Creates a `PENDING` campaign and publishes `CAMPAIGN_SUBMITTED`.

- `GET /api/campaigns/{id}/`
  Public detail for approved/ongoing campaigns.

- `GET /api/campaigns/nearby/?lat=...&lng=...&radius_km=...`
  Public nearby campaign search with `distance_km`.

- `GET /api/campaigns/mine/`
  Verified hospital only. Lists campaigns submitted by the current hospital.

- `GET /api/campaigns/pending/`
  Admin only. Lists campaigns waiting for review.

- `POST /api/campaigns/{id}/review/`
  Admin only. Body: `{ "action": "approve" }` or `{ "action": "reject", "reason": "..." }`.

- `PATCH /api/campaigns/{id}/progress/`
  Owning hospital only. Body: `{ "actual_donors": 12, "actual_volume_ml": 5400 }`.

- `POST /api/campaigns/{id}/cancel/`
  Owning hospital only. Cancels a campaign unless it is already completed.

- `POST /api/campaigns/{id}/interest/`
  Donor only. Registers interest idempotently.

- `DELETE /api/campaigns/{id}/interest/`
  Donor only. Withdraws interest idempotently.

## Myth Endpoints

- `GET /api/myths/`
  Public list of published myth articles. Supports `category`.

- `GET /api/myths/{id}/`
  Public detail for a published article.

- `POST /api/myths/create/`
  Admin only. Creates a myth article.

- `PATCH /api/myths/{id}/edit/`
  Admin only. Updates or unpublishes a myth article.

## Events

Campaign service publishes to Redis channel `bden.events`, and also publishes the raw payload to a same-name channel for manual debugging.

- `CAMPAIGN_SUBMITTED`
- `CAMPAIGN_APPROVED`
- `CAMPAIGN_REJECTED`
- `CAMPAIGN_PROGRESS_UPDATED`
- `CAMPAIGN_CANCELLED`

The service does not consume events in MVP.

## Seed Data

Seed starter myth articles:

```bash
docker compose run --rm campaign-service python manage.py seed_myths
```

The command is idempotent.

## Local Checks

```bash
docker compose build campaign-service
docker compose run --rm campaign-service python manage.py check
docker compose run --rm campaign-service python manage.py migrate
docker compose run --rm campaign-service pytest
```

Current status: campaign-service tests pass.
