# Jenkins Local Setup on Windows

Local Jenkins is Docker-based and intended for test/build automation before the VPS is ready.

## Prerequisites

- Windows 10/11
- Docker Desktop with Linux containers enabled
- Git installed
- Node.js and Python available on the host if you want to run the same commands outside Jenkins

## Start Jenkins

From the repo root:

```powershell
docker compose -f infrastructure/jenkins/docker-compose.yml up -d
```

Open:

```text
http://localhost:8081
```

Get the initial password:

```powershell
docker logs bden-jenkins
```

Install the suggested plugins, then add these if missing:

- Pipeline
- Git
- Docker Pipeline
- GitHub
- AnsiColor

## Create the Pipeline Job

Create a new Pipeline job named `BDEN`.

Use Pipeline script from SCM:

```text
SCM: Git
Repository URL: https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git
Branch: */feature/django-backend-auth-foundation
Script Path: Jenkinsfile
```

For a private repository, add GitHub credentials in Jenkins first and select them in the job.

## Docker Access Notes

The local compose file mounts `/var/run/docker.sock`. This works when Docker Desktop exposes the socket to Linux containers. If Jenkins cannot run Docker commands, use a Jenkins agent that has Docker CLI access or run the pipeline stages manually from PowerShell while keeping Jenkins as the orchestration target.

## Common Build Failures

If the `Django Service Tests` stage fails while building an image with a `ReadTimeoutError` from `files.pythonhosted.org`, Jenkins reached Docker but `pip install` timed out while downloading dependencies. The service Dockerfiles use longer pip timeouts and retries, so rerun the build after pulling the latest branch. If the network is still unstable, rerun the failed build; completed dependency layers are reused by Docker.

## What The Pipeline Runs

- checkout
- Python syntax checks for Django services
- auth-service tests
- donor-service tests
- frontend install/build
- `docker compose config --quiet`

Deployment is deliberately disabled until the VPS/K3s environment is ready.
