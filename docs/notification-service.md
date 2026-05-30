# Notification Service

The notification service owns in-app notification storage, read state, user preferences, and event-driven notification creation.

## Service Scope

- Store in-app notifications for users.
- Track read and delivery state.
- Expose unread counts and notification preferences.
- Accept internal notification creation requests from other services.
- Consume Redis events from `bden.events`.

## Models

- `Notification`: user id, type, title, body, read state, data payload, email status, timestamps.
- `NotificationPreference`: per-user push/email preferences and optional quiet hours.

## Public API

Base path through the gateway: `/api/notifications/`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/notifications/` | List notifications. Uses JWT user id when available, or legacy `user_id` query param. |
| `POST` | `/api/notifications/mark-read/` | Mark selected notifications read with `notification_ids`, or all with `all: true`. |
| `PUT` | `/api/notifications/{id}/read/` | Legacy single-notification read endpoint. |
| `PUT` | `/api/notifications/read-all/` | Legacy mark-all endpoint. |
| `GET` | `/api/notifications/unread-count/` | Get unread count for the current or requested user. |
| `GET` | `/api/notifications/preferences/` | Get current user's notification preferences. |
| `PUT` | `/api/notifications/preferences/` | Update current user's notification preferences. |

## Internal API

Internal endpoints require `X-Internal-API-Key`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/notifications/create/` | Create one notification. |
| `POST` | `/api/notifications/bulk/` | Create notifications for many users. |

## Events

The service consumes Redis channel `bden.events`. The MVP handler is ready for emergency request notifications and can be expanded as donor matching becomes richer.

Run manually with:

```bash
python manage.py consume_events
```

Docker Compose includes `notification-event-consumer` for local development.

## API Docs

- Swagger: `/swagger/` on the notification-service port, or via service routing when exposed.
- ReDoc: `/redoc/`

