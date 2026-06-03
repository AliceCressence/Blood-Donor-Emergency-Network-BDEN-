# Jenkins Server Setup on VPS

This guide prepares the CI/CD path for an Ubuntu VPS. For the complete BDEN Lightsail setup, including domain, Nginx, K3s/Kubernetes direction, firewall, and rollback flow, use [BDEN VPS Configuration Guide](vps_config.md).

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

The production Compose stack expects a real `.env.prod` file. Create it in the Jenkins workspace or symlink it from a safer server path.

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

## Production Compose Deployment

The current production deployment path is Docker Compose:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod config --quiet
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod up -d --build
```

The production stack exposes only local loopback ports:

```text
127.0.0.1:8088 -> frontend React app
127.0.0.1:8080 -> backend API gateway
```

Host Nginx should proxy:

```text
/      -> http://127.0.0.1:8088
/api/  -> http://127.0.0.1:8080
/health/ -> http://127.0.0.1:8080
/django-admin/ -> http://127.0.0.1:8080
```

The root `Jenkinsfile` deploys production only when:

- the branch is `main`;
- `DEPLOY_PROD` is enabled;
- `.env.prod` exists in the workspace;
- CI checks pass first.

## Docker Registry

A registry is optional for the current single-VPS Compose deployment because Jenkins builds images directly on the VPS. When moving to K3s, add registry credentials in Jenkins and extend the Jenkinsfile with image push stages for each service.

## Future K3s Deployment

The planned target is a `bden-prod` K3s namespace. Future deployment stages should:

- build and push service images
- apply Kubernetes manifests from `infrastructure/k8s`
- run database migrations as Kubernetes jobs
- rollout restart changed deployments
- verify `/health/...` endpoints through the gateway

Until then, Jenkins runs tests, frontend build, production Compose validation, and production Compose deployment on `main`.
