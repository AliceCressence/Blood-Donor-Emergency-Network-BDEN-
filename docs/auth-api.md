# Auth API

Base URL through the gateway:

```text
http://localhost:8000
```

Interactive documentation:

```text
Swagger UI: http://localhost:8000/api/docs/swagger/
ReDoc:      http://localhost:8000/api/docs/redoc/
OpenAPI:   http://localhost:8000/api/schema.json
```

## Donor Registration

`POST /api/auth/register/donor/`

```json
{
  "email": "donor@example.com",
  "password": "StrongPass123",
  "first_name": "Jean",
  "last_name": "Mbarga",
  "phone": "+237699000000",
  "city": "Yaounde",
  "blood_type": "O+"
}
```

Returns `access`, `refresh`, and `user`. The auth service creates the user and calls donor-service at `POST /internal/donors/create-profile/`.

## Hospital Registration

`POST /api/auth/register/hospital/`

```json
{
  "email": "hospital@example.com",
  "password": "Hospital123",
  "facility_name": "Central Hospital",
  "facility_type": "HOSPITAL",
  "registration_number": "CM-REG-001",
  "address": "Avenue Kennedy",
  "city": "Yaounde",
  "region": "Centre",
  "contact_phone": "+237699000000"
}
```

Returns a pending status. No JWT is issued until an admin approves the hospital.

## Login

`POST /api/auth/login/`

```json
{
  "email": "donor@example.com",
  "password": "StrongPass123"
}
```

Returns:

```json
{
  "access": "...",
  "refresh": "...",
  "user": {
    "id": "...",
    "email": "donor@example.com",
    "role": "donor",
    "isVerified": true
  }
}
```

Unverified hospital accounts receive `400` with `hospital_pending_verification`.

## Google OAuth

Google OAuth is donor-only. Hospitals must use the hospital registration workflow because they require admin verification.

`GET /api/auth/google/`

Returns:

```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

The frontend redirects the browser to that URL. Google redirects back to:

```text
http://localhost:5173/auth/google/callback
```

The frontend then sends Google's code to:

`POST /api/auth/google/callback/`

```json
{
  "code": "google-authorization-code",
  "redirect_uri": "http://localhost:5173/auth/google/callback"
}
```

Returns BDEN `access`, `refresh`, and `user` like normal donor login.

## Refresh

`POST /api/auth/token/refresh/`

```json
{ "refresh": "..." }
```

## Logout

`POST /api/auth/logout/`

Requires `Authorization: Bearer <access>`.

```json
{ "refresh": "..." }
```

## Admin Hospital Review

`GET /api/admin/hospitals/pending/`

`POST /api/admin/hospitals/{hospital_user_id}/verify/`

```json
{ "action": "approve" }
```

```json
{
  "action": "reject",
  "reason": "Registration number could not be verified."
}
```

## Django Admin Operations

Each backend service owns its own database, so Django admin users are created per service. A superuser created in auth-service does not automatically exist in donor-service, request-service, campaign-service, or notification-service.

### Admin URLs

Local development gateway:

```text
Auth:         http://localhost:8000/reserved/auth/
Donor:        http://localhost:8000/reserved/donor/
Request:      http://localhost:8000/reserved/request/
Campaign:     http://localhost:8000/reserved/campaign/
Notification: http://localhost:8000/reserved/notification/
```

Production:

```text
Auth:         https://bden.hinkaku.tech/reserved/auth/
Donor:        https://bden.hinkaku.tech/reserved/donor/
Request:      https://bden.hinkaku.tech/reserved/request/
Campaign:     https://bden.hinkaku.tech/reserved/campaign/
Notification: https://bden.hinkaku.tech/reserved/notification/
```

The public admin prefix is configurable with:

```env
ADMIN_URL=/reserved
```

Use a leading slash and no trailing slash. These public URLs proxy to each service's internal `/django-admin/` route.

### Create Superusers Locally

From the repository root:

```bash
docker compose --env-file .env -p bden-dev run --rm auth-service python manage.py createsuperuser
docker compose --env-file .env -p bden-dev run --rm donor-service python manage.py createsuperuser
docker compose --env-file .env -p bden-dev run --rm request-service python manage.py createsuperuser
docker compose --env-file .env -p bden-dev run --rm campaign-service python manage.py createsuperuser
docker compose --env-file .env -p bden-dev run --rm notification-service python manage.py createsuperuser
```

For auth-service, the login field is `email`, and the role should be `ADMIN`. The other services use their own Django admin user records for their own admin dashboards.

### Create Superusers On The VPS

SSH into the VPS, then run:

```bash
cd /var/www/bden

docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod exec auth-service python manage.py createsuperuser
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod exec donor-service python manage.py createsuperuser
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod exec request-service python manage.py createsuperuser
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod exec campaign-service python manage.py createsuperuser
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod exec notification-service python manage.py createsuperuser
```

If a service is not running yet, start the stack first:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod up -d
```

If you need to create an auth-service admin non-interactively, use environment variables:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod exec auth-service sh -c \
  'DJANGO_SUPERUSER_EMAIL=admin@example.com DJANGO_SUPERUSER_PASSWORD="ChangeMeSafely123!" DJANGO_SUPERUSER_ROLE=ADMIN python manage.py createsuperuser --noinput'
```

After creating the account, open the matching service admin URL and sign in with that service's superuser credentials.
