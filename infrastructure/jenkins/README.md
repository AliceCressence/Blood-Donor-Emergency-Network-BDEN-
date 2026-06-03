# Local Jenkins

This folder runs Jenkins LTS for local CI experiments.

```bash
docker compose -f infrastructure/jenkins/docker-compose.yml up -d
```

Open `http://localhost:8081`, unlock Jenkins with the initial admin password from the container logs, then create a Pipeline job that points to:

```text
https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git
```

The root `Jenkinsfile` performs checkout, Compose validation, Django checks/tests for all services, frontend lint/build, production image build, and production deployment from `main` when `DEPLOY_PROD` is enabled.

For local Jenkins experiments, leave `DEPLOY_PROD` disabled unless you deliberately created a local `.env.prod` and want to test the production Compose stack.
