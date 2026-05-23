# Deployment Notes

The production target is a low-cost VPS such as AWS Lightsail running Docker now and K3s/Kubernetes later.

## MVP Deployment Shape

- Nginx is the public entry point.
- Django services run as independent containers.
- Each service owns its own PostgreSQL database.
- Redis supports event publication and later Celery task queues.
- Jenkins will build images and deploy them to the VPS/K3s cluster.
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

## Kubernetes Direction

The intended K3s production namespace is `bden-prod`. Each Django service should become a Deployment with a ClusterIP Service. Only the Nginx gateway should be publicly reachable.
