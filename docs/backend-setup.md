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
- one donor event consumer container
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

Redis listens on `redis:6379` inside Docker and `localhost:16379` from the host by default. Override the host port with `REDIS_HOST_PORT`.

`http://localhost:8000/` is a gateway index, not a Django app page. Use these routes while developing:

```bash
curl http://localhost:8000/
curl http://localhost:8000/health/auth/
curl http://localhost:8000/api/docs/swagger/
curl http://localhost:8000/api/donor/docs/
```

## Run Migrations Manually

The auth and donor service containers run migrations on startup. To run them manually:

```bash
docker compose run --rm auth-service python manage.py migrate
docker compose run --rm donor-service python manage.py migrate
```

Seed donor screening centers:

```bash
docker compose run --rm donor-service python manage.py seed_screening_centers
```

Create an admin user:

```bash
docker compose run --rm auth-service python manage.py createsuperuser
```

The auth admin is available at `http://localhost:8000/django-admin/auth/` or directly at `http://localhost:8001/django-admin/`. Donor admin is available at `http://localhost:8000/django-admin/donor/` or directly at `http://localhost:8002/django-admin/`.

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
```

For local virtualenv workflows, install each service's `requirements.txt` and run the same `pytest` commands inside the service folder.
