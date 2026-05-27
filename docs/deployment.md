# Deployment Notes

The production target is an AWS Lightsail VPS running K3s/Kubernetes for orchestration, with host Nginx as the public reverse proxy. The detailed server setup guide is [BDEN VPS Configuration Guide](vps_config.md).

## MVP Deployment Shape

- Nginx is the public entry point.
- Django services run as independent containers.
- Each service owns its own PostgreSQL database.
- Redis supports event publication and later Celery task queues.
- Jenkins currently runs checkout, syntax checks, auth/donor tests, frontend build, and Compose validation locally. The VPS guide defines the production path for native Jenkins on Ubuntu, Kubernetes deployment, host Nginx, SSL, webhooks, and health checks.
- Prometheus and Grafana will collect service health and performance metrics.

## Production Settings

Use each service's `config.settings.prod` module in production:

```bash
DJANGO_SETTINGS_MODULE=config.settings.prod
```

Production must provide real values for:

- service secret keys
- database credentials
- `ALLOWED_HOSTS`
- `INTERNAL_API_KEY`
- SMTP credentials
- Google OAuth credentials if OAuth is enabled

## API Documentation

Auth-service exposes OpenAPI documentation with drf-yasg:

```text
/api/docs/swagger/
/api/docs/redoc/
/api/schema.json
```

Donor-service exposes OpenAPI documentation with drf-yasg:

```text
/api/donor/docs/
/api/donor/redoc/
```

In production these should remain behind the gateway. If the public deployment should not expose interactive docs, restrict them at Nginx or with service permissions before launch.

## Kubernetes Direction

The intended K3s production namespace is `bden-prod`. Each Django service should become a Deployment with a ClusterIP Service. Only the Nginx gateway should be publicly reachable.

## Jenkins References

- Local Windows/Docker setup: [Jenkins Local Setup on Windows](jenkins-local-windows.md)
- VPS setup path: [Jenkins Server Setup on VPS](jenkins-server-vps.md)
- Full Lightsail production guide: [BDEN VPS Configuration Guide](vps_config.md)
