# Backend Setup

## Prerequisites

- Python 3.11+
- Docker and Docker Compose
- Node.js 18+ for the frontend

## Environment

Create a local `.env` if you need to override defaults:

```bash
cp .env.example .env
```

The checked-in defaults are safe for local development only.

## Start Services

```bash
docker compose up --build
```

The Compose stack starts:

- five PostgreSQL containers
- Redis
- five Django service containers
- donor, request, and notification event consumer containers
- Nginx gateway on `localhost:8000`

The PostgreSQL containers listen on port `5432` inside Docker. For host tools such as `psql` or a database GUI, the default local host ports are:

| Service | Host port |
| --- | ---: |
| auth-db | 15432 |
| donor-db | 15433 |
| request-db | 15434 |
| campaign-db | 15435 |
| notification-db | 15436 |

These can be overridden in `.env` with `AUTH_DB_HOST_PORT`, `DONOR_DB_HOST_PORT`, `REQUEST_DB_HOST_PORT`, `CAMPAIGN_DB_HOST_PORT`, and `NOTIFICATION_DB_HOST_PORT`.

Inside Docker, service database hosts must be the Compose service names, for example `request-db` and `notification-db`. The request and notification `dev.py` settings now read `*_DB_HOST` and `*_DB_PORT` from the environment so the same code works from Compose and from host-based tooling.

Redis listens on `redis:6379` inside Docker and `localhost:16379` from the host by default. Override the host port with `REDIS_HOST_PORT`.

`http://localhost:8000/` is a gateway index, not a Django app page. Use these routes while developing:

```bash
curl http://localhost:8000/
curl http://localhost:8000/health/auth/
curl http://localhost:8000/api/docs/swagger/
curl http://localhost:8000/api/donor/docs/
curl http://localhost:8003/swagger/
curl http://localhost:8004/api/docs/
curl http://localhost:8005/swagger/
```

## Run Migrations Manually

The auth and donor service containers run migrations on startup. To run them manually:

```bash
docker compose run --rm auth-service python manage.py migrate
docker compose run --rm donor-service python manage.py migrate
docker compose run --rm request-service python manage.py migrate
docker compose run --rm campaign-service python manage.py migrate
docker compose run --rm notification-service python manage.py migrate
```

Seed donor screening centers:

```bash
docker compose run --rm donor-service python manage.py seed_screening_centers
docker compose run --rm campaign-service python manage.py seed_myths
```

Create an admin user:

```bash
docker compose run --rm auth-service python manage.py createsuperuser
```

The auth admin is available at `http://localhost:8000/django-admin/auth/` or directly at `http://localhost:8001/django-admin/`. Donor admin is available at `http://localhost:8000/django-admin/donor/` or directly at `http://localhost:8002/django-admin/`.

Request and notification service admins are available directly at:

```text
http://localhost:8003/django-admin/
http://localhost:8004/django-admin/
http://localhost:8005/django-admin/
```

## Campaign Service

Campaign-service owns donation campaigns and myth-debunking articles. Hospitals submit campaigns as `PENDING`, admins approve or reject them, and approved campaigns become publicly discoverable.

Useful routes:

```text
http://localhost:8004/api/docs/
http://localhost:8004/api/campaigns/
http://localhost:8004/api/myths/
http://localhost:8000/api/campaign/docs/
```

Campaign approval publishes Redis events such as `CAMPAIGN_APPROVED`; notification-service can consume those later for donor and hospital notifications.

## Request And Notification Events

Request-service publishes lifecycle events to Redis channel `bden.events`. Notification-service consumes the same channel and can also receive direct internal notification creation calls.

Manual consumers:

```bash
docker compose run --rm request-service python manage.py consume_events
docker compose run --rm notification-service python manage.py consume_events
```

The normal local stack starts `request-event-consumer` and `notification-event-consumer` automatically.

## Donor Service Reset Note

The previous lightweight donor `profiles` app has been replaced by `donors` and `estimation`. There is no production donor database yet, so local developers with old donor volumes should reset the donor database volume before migrating:

```bash
docker compose down
docker volume rm blood-donor-emergency-network-bden-_donor_db_data
docker compose up --build donor-service
```

WhiteNoise is configured directly in each Django service. The old root `apply_whitenoise.py` helper is no longer needed.

## Run Tests

```bash
docker compose run --rm auth-service pytest
docker compose run --rm donor-service pytest
docker compose run --rm request-service pytest
docker compose run --rm campaign-service pytest
docker compose run --rm notification-service pytest
```

For local virtualenv workflows, install each service's `requirements.txt` and run the same `pytest` commands inside the service folder.
