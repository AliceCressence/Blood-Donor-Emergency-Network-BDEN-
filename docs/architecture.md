# BDEN Architecture

BDEN uses a container-first Django REST microservices architecture with a React/Vite frontend.

## Mission

The platform reduces the time required to find compatible blood donors during emergencies while also supporting planned donation campaigns, donor trust, and inclusive onboarding for people who do not yet know their blood type.

## Services

| Service | Responsibility |
|---|---|
| API Gateway | Nginx single entry point for browser/API traffic |
| auth-service | Registration, login, JWT, roles, hospital verification |
| donor-service | Donor profiles, donor card, blood type, availability, matching data |
| request-service | Emergency request lifecycle and donor responses |
| campaign-service | Campaign lifecycle, public campaigns, myth content |
| notification-service | Email/in-app notifications and async event handling |

## Architecture Principles

- Every backend service is a Django REST Framework app with its own database.
- PostgreSQL is split per service to preserve ownership boundaries.
- Redis is used for event publication, caching, and later Celery broker duties.
- Nginx is the local and production gateway.
- The frontend talks to the gateway, never directly to legacy Express code.
- Internal service-to-service endpoints use a shared `X-Internal-API-Key` header for the MVP.

## Current Milestone

This foundation implements auth-service and the minimum donor-service internal profile endpoint required to complete donor registration. Request, campaign, and notification services are scaffolded with health checks and production-ready settings layout so later features can be added without changing the repo shape again.
