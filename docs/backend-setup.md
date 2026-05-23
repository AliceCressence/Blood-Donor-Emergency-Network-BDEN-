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
- Nginx gateway on `localhost:8080`

## Run Migrations Manually

The auth and donor service containers run migrations on startup. To run them manually:

```bash
docker compose run --rm auth-service python manage.py migrate
docker compose run --rm donor-service python manage.py migrate
```

Create an admin user:

```bash
docker compose run --rm auth-service python manage.py createsuperuser
```

## Run Tests

```bash
docker compose run --rm auth-service pytest
docker compose run --rm donor-service pytest
```

For local virtualenv workflows, install each service's `requirements.txt` and run the same `pytest` commands inside the service folder.
