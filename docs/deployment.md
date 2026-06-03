# Deployment Notes

The production target is an AWS Lightsail VPS with host Nginx as the public reverse proxy. The current deployable MVP uses Docker Compose through `docker-compose.prod.yml`; K3s/Kubernetes remains the orchestration direction for the next deployment phase. The detailed server setup guide is [BDEN VPS Configuration Guide](vps_config.md).

## MVP Deployment Shape

- Host Nginx is the public entry point.
- `frontend` serves the built React/Vite app on `127.0.0.1:8088`.
- `gateway` serves the backend API gateway on `127.0.0.1:8080`.
- Django services run as independent containers.
- Each service owns its own PostgreSQL database.
- Redis supports event publication and later Celery task queues.
- Jenkins runs checkout, syntax checks, Django checks/tests, frontend lint/build, Compose validation, production image build, and production deployment on `main`.
- Prometheus and Grafana will collect service health and performance metrics.

## Compose Files

Use different Compose files for different environments:

```text
docker-compose.yml        Local development stack
docker-compose.prod.yml   Production Docker Compose stack
```

The local file intentionally exposes service and database ports for debugging. The production file only exposes the frontend and backend gateway on loopback ports so host Nginx can proxy them safely.

Production startup:

```bash
cp .env.prod.example .env.prod
# edit .env.prod with real secrets, domain, OAuth values, and DB passwords
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod config --quiet
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod up -d --build
```

Health checks from the VPS:

```bash
curl http://127.0.0.1:8088/health/
curl http://127.0.0.1:8080/health/auth/
curl http://127.0.0.1:8080/health/donor/
curl http://127.0.0.1:8080/health/request/
curl http://127.0.0.1:8080/health/campaign/
curl http://127.0.0.1:8080/health/notification/
```

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

Use `.env.prod.example` as the production template. Keep the real `.env.prod` file on the VPS/Jenkins workspace only; do not commit it.

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

## Jenkins Production Flow

The root `Jenkinsfile` has two separated paths:

- CI path: runs on branches and pull requests using `docker-compose.yml` and `.env.example`.
- Production path: runs on `main` when `DEPLOY_PROD=true`, using `docker-compose.prod.yml` and `.env.prod`.

The production deploy stage:

1. validates `.env.prod` exists;
2. validates production Compose config;
3. builds production images;
4. runs `docker compose up -d --remove-orphans`;
5. checks frontend and backend health endpoints.

The cleanup step only shuts down the CI Compose project (`bden-ci`), not the production project (`bden-prod`).

## Kubernetes Direction

The intended K3s production namespace is `bden-prod`. Each Django service should become a Deployment with a ClusterIP Service. Only the frontend and gateway ingress paths should be publicly reachable. Until the Kubernetes manifests are finalized, `docker-compose.prod.yml` is the working production deployment path.

## Jenkins References

- Local Windows/Docker setup: [Jenkins Local Setup on Windows](jenkins-local-windows.md)
- VPS setup path: [Jenkins Server Setup on VPS](jenkins-server-vps.md)
- Full Lightsail production guide: [BDEN VPS Configuration Guide](vps_config.md)
