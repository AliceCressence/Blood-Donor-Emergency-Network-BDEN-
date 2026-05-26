# Deployment Notes

The production target is a low-cost VPS such as AWS Lightsail running Docker now and K3s/Kubernetes later.

## MVP Deployment Shape

- Nginx is the public entry point.
- Django services run as independent containers.
- Each service owns its own PostgreSQL database.
- Redis supports event publication and later Celery task queues.
- Jenkins currently runs checkout, syntax checks, auth/donor tests, frontend build, and Compose validation. Image build/push and deployment are placeholders until the VPS/K3s target is ready.
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
