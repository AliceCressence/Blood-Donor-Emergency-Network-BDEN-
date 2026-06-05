# Jenkins Server Setup on VPS

This guide prepares the CI/CD path for an Ubuntu VPS. For the complete BDEN Lightsail setup, including domain, Nginx, k3s/Kubernetes, firewall, and rollback flow, use [BDEN VPS Configuration Guide](vps_config_formatted.md).

## Prerequisites

- Ubuntu 22.04 or 24.04 VPS
- Domain or public IP
- SSH access with sudo
- Docker and Docker Compose plugin
- Java 21 or newer for current Jenkins LTS packages
- GitHub repository access

Install Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out and back in so the Docker group applies.

## Option A: Jenkins in Docker

```bash
mkdir -p ~/bden-jenkins
cd ~/bden-jenkins
curl -O https://raw.githubusercontent.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-/feature/django-backend-auth-foundation/infrastructure/jenkins/docker-compose.yml
docker compose up -d
```

Expose Jenkins behind Nginx or access it over SSH tunnel until TLS is configured.

## Option B: Native Jenkins

```bash
sudo apt update
sudo apt install -y fontconfig openjdk-21-jre
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins
sudo systemctl enable --now jenkins
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

If `openjdk-21-jre` is not available on your image, install Java 21 from a trusted vendor package source such as Eclipse Temurin/Adoptium, then verify:

```bash
java -version
sudo systemctl restart jenkins
```

## GitHub Integration

Create a Pipeline job using:

```text
Repository URL: https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git
Script Path: Jenkinsfile
```

For automatic builds, configure a GitHub webhook:

```text
http://<jenkins-host>/github-webhook/
```

Use GitHub credentials or a fine-grained PAT if the repository is private.

## Production Environment File

The production Kubernetes deployment expects a real `.env.prod` file. Jenkins uses it to validate/build production images and to create the `bden-env` Kubernetes secret.

Recommended server path:

```bash
sudo mkdir -p /var/www/bden
sudo cp /path/to/repo/.env.prod.example /var/www/bden/.env.prod
sudo nano /var/www/bden/.env.prod
sudo chown jenkins:jenkins /var/www/bden/.env.prod
sudo chmod 600 /var/www/bden/.env.prod
```

If Jenkins checks out BDEN into its normal workspace, add a symlink inside the workspace:

```bash
cd /var/lib/jenkins/workspace/<your-bden-job>
ln -sf /var/www/bden/.env.prod .env.prod
```

Do not commit `.env.prod`.

## Production Kubernetes Deployment

The current production deployment path is k3s/Kubernetes. Docker Compose is used only to build images:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod config --quiet
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod build
```

Jenkins then pushes those images to the local registry and applies `infrastructure/k8s/*.yaml`. Host Nginx should proxy public BDEN traffic to:

```text
127.0.0.1:30080 -> Kubernetes gateway NodePort
```

The root `Jenkinsfile` deploys production only when:

- the branch is `main`;
- `DEPLOY_PROD` is enabled;
- `.env.prod` exists in the workspace;
- CI checks pass first.

## Local Docker Registry

The current single-VPS k3s deployment uses a local Docker registry bound to loopback:

```text
127.0.0.1:5000 -> bden-local-registry
```

Jenkins builds images with `docker-compose.prod.yml`, tags them as `localhost:5000/bden/<image>:<BUILD_NUMBER>`, pushes them to the local registry, and updates the Kubernetes deployments with those exact tags.

## Troubleshooting Docker Build DNS

If Jenkins fails while building a service image with messages like:

```text
Temporary failure resolving 'deb.debian.org'
E: Unable to locate package build-essential
```

the failure happened before Django tests started. Docker could not resolve Debian package repositories during `apt-get update`.

Check DNS from the VPS:

```bash
getent hosts deb.debian.org
curl -I https://deb.debian.org
docker run --rm python:3.11-slim-bookworm getent hosts deb.debian.org
```

If host DNS works but Docker DNS fails, configure Docker daemon DNS:

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "dns": ["1.1.1.1", "8.8.8.8"]
}
EOF

sudo systemctl restart docker
sudo systemctl restart jenkins
```

Then retry:

```bash
cd /var/www/bden
docker compose --env-file .env.example -p bden-ci build request-service
```

## Kubernetes Deployment Behavior

The active deployment target is the `bden-prod` k3s namespace. Jenkins:

- builds frontend and service images;
- pushes them to `localhost:5000`;
- creates or updates the `bden-env` secret from `.env.prod`;
- applies manifests from `infrastructure/k8s`;
- updates deployment images to the current build tag;
- verifies `/health/...` endpoints through `127.0.0.1:30080`.
