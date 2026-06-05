# Deployment Notes

The production target is an AWS Lightsail VPS with host Nginx as the public reverse proxy. The active production runtime is k3s/Kubernetes. Docker Compose is still used by Jenkins to build production images through `docker-compose.prod.yml`, then those images are pushed to the local VPS registry and deployed to k3s. The detailed server setup guide is [BDEN VPS Configuration Guide](vps_config_formatted.md).

## MVP Deployment Shape

- Host Nginx is the public entry point.
- Host Nginx proxies BDEN traffic to the k3s gateway NodePort at `127.0.0.1:30080`.
- `frontend` serves the built React/Vite app inside the cluster.
- `gateway` is an in-cluster Nginx deployment that routes frontend and API traffic.
- Django services run as independent Kubernetes deployments.
- Each service owns its own PostgreSQL database.
- Redis supports event publication and later Celery task queues.
- Jenkins runs checkout, syntax checks, Django checks/tests, frontend build, Compose validation, production image build, local registry push, and Kubernetes deployment on `main`.
- Prometheus and Grafana will collect service health and performance metrics.

## Runtime Files

Use different files for build-time and runtime:

```text
docker-compose.yml        Local development stack
docker-compose.prod.yml   Production image build file
infrastructure/k8s/*.yaml Production Kubernetes runtime manifests
```

The local file intentionally exposes service and database ports for debugging. The production Compose file is used to build images on the VPS. The public site is served by host Nginx through the Kubernetes gateway NodePort.

Production validation/build:

```bash
cp .env.prod.example .env.prod
# edit .env.prod with real secrets, domain, OAuth values, and DB passwords
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod config --quiet
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod build
```

Health checks from the VPS:

```bash
curl -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/
curl -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/auth/
curl -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/donor/
curl -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/request/
curl -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/campaign/
curl -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/notification/
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
- Full Lightsail production guide: [BDEN VPS Configuration Guide](vps_config_formatted.md)
