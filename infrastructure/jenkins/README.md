# Local Jenkins

This folder runs Jenkins LTS for local CI experiments.

```bash
docker compose -f infrastructure/jenkins/docker-compose.yml up -d
```

Open `http://localhost:8081`, unlock Jenkins with the initial admin password from the container logs, then create a Pipeline job that points to:

```text
https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git
```

The root `Jenkinsfile` performs checkout, Django syntax checks, auth/donor service tests, frontend build, and Docker Compose validation. Deployment is present only as a disabled placeholder until the VPS target exists.
