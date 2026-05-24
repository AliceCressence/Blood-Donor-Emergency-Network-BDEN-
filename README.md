# BDEN — Blood Donor Emergency Network

BDEN is a React + Django REST microservices platform for coordinating emergency blood donation between voluntary donors, hospitals, and platform administrators.

The active backend is Django REST Framework. The old Express authentication prototype is preserved under `legacy/auth-service-express/` for reference only and must not be used by the frontend.

## Monorepo Layout

```text
frontend/                         React/Vite application
services/
  auth-service/                   Django auth, JWT, roles, hospital verification
  donor-service/                  Django donor profile service
  request-service/                Django emergency request service scaffold
  campaign-service/               Django campaign service scaffold
  notification-service/           Django notification service scaffold
infrastructure/
  docker/                         Legacy Docker notes and helpers
  nginx/                          Local API gateway
  k8s/                            Future Kubernetes manifests
  jenkins/                        Future Jenkins pipeline assets
  prometheus/                     Future monitoring config
legacy/auth-service-express/      Deprecated Express prototype
docs/                             Architecture, backend, auth API, deployment notes
```

## Local Development

Copy environment defaults when you need local overrides:

```bash
cp .env.example .env
```

Start backend infrastructure and services:

```bash
docker compose up --build
```

The gateway listens on `http://localhost:8080`.

Opening `http://localhost:8080/` returns a small JSON gateway index. The backend itself is API-first, so most useful routes are under `/api/...`, `/health/...`, and `/django-admin/...`.

Useful health checks:

```bash
curl http://localhost:8080/health/auth/
curl http://localhost:8080/health/donor/
curl http://localhost:8080/health/request/
curl http://localhost:8080/health/campaign/
curl http://localhost:8080/health/notification/
```

Auth API documentation:

```bash
http://localhost:8080/api/docs/swagger/
http://localhost:8080/api/docs/redoc/
http://localhost:8080/api/schema.json
```

Django admin:

```bash
http://localhost:8080/django-admin/auth/
http://localhost:8001/django-admin/  # auth-service direct
http://localhost:8002/django-admin/  # donor-service direct
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend expects `VITE_API_BASE_URL=http://localhost:8080`, which is already the default in `frontend/src/services/auth.service.js`.

For Google OAuth, configure these values in `.env` and in the Google Cloud Console OAuth client:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
GOOGLE_AUTH_FRONTEND_CALLBACK_URL=http://localhost:5173/auth/google/callback
```

## Backend Services

The first implemented milestone is authentication plus the donor profile dependency needed by donor registration:

- donor registration creates an auth user and calls donor-service internally
- hospital registration creates an unverified hospital account pending admin approval
- login issues SimpleJWT access and refresh tokens
- unverified hospital login is blocked
- admin users can list, approve, and reject hospital registrations

Each Django service uses:

```text
config/settings/base.py
config/settings/dev.py
config/settings/prod.py
```

## Documentation

- [Architecture](docs/architecture.md)
- [Backend Setup](docs/backend-setup.md)
- [Auth API](docs/auth-api.md)
- [Deployment Notes](docs/deployment.md)

## Status

Active development for the SEN3244 Software Architecture project.
