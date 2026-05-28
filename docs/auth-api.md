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
