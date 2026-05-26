# Jenkins Server Setup on VPS

This guide prepares the CI/CD path for an Ubuntu VPS. Deployment stages remain disabled until the production target is provisioned.

## Prerequisites

- Ubuntu 22.04 or 24.04 VPS
- Domain or public IP
- SSH access with sudo
- Docker and Docker Compose plugin
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
sudo apt install -y fontconfig openjdk-17-jre
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins
sudo systemctl enable --now jenkins
sudo usermod -aG docker jenkins
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

## Docker Registry

When deployment begins, add Docker registry credentials in Jenkins and extend the Jenkinsfile with image build/push stages for each service.

## Future K3s Deployment

The planned target is a `bden-prod` K3s namespace. Future deployment stages should:

- build and push service images
- apply Kubernetes manifests from `infrastructure/k8s`
- run database migrations as Kubernetes jobs
- rollout restart changed deployments
- verify `/health/...` endpoints through the gateway

Until then, Jenkins should only run tests, frontend build, and Compose validation.
