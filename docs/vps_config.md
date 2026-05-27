# BDEN VPS Configuration Guide

This guide prepares the AWS Lightsail VPS for BDEN production deployment beside the existing TrashTrails project.

Target server:

```text
Provider: AWS Lightsail
User: ubuntu
IP: 63.180.80.161
Project path: /var/www/BDEN
Existing project path: /var/www/TrashTrails
Preferred domain: bden.hinkaku.tech
Repository: https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git
Jenkins mode: Native Jenkins installed on Ubuntu
Orchestration: K3s Kubernetes on the VPS
```

The production shape is:

```text
GitHub main / PR to main
        |
        v
Jenkins on VPS
        |
        v
checkout -> tests -> frontend build -> docker compose validation -> image build -> Kubernetes deploy
        |
        v
K3s namespace bden-prod
        |
        v
BDEN Kubernetes workloads and ClusterIP services
        |
        v
Kubernetes NodePort gateway on 127.0.0.1:30080
        |
        v
Host Nginx virtual host bden.hinkaku.tech -> 127.0.0.1:30080
```

This keeps BDEN separate from TrashTrails. Host Nginx owns public ports `80` and `443`; BDEN's Kubernetes gateway is exposed through the K3s NodePort `30080` and should not be opened in the Lightsail firewall.

## 1. DNS

Create a DNS record:

```text
Type: A
Name: bden
Value: 63.180.80.161
TTL: 300 or automatic
```

Expected behavior:

```bash
dig +short bden.hinkaku.tech
```

Expected output:

```text
63.180.80.161
```

If DNS is not ready yet, you can still deploy using the raw IP for internal tests:

```text
http://63.180.80.161
http://63.180.80.161/api/auth/google/callback
```

SSL and clean frontend OAuth callbacks are much easier with `bden.hinkaku.tech`, because Google OAuth production clients normally expect stable authorized origins and redirect URIs.

## 2. Connect To The VPS

From your local machine:

```bash
chmod 600 /path/to/key.pem
ssh -i /path/to/key.pem ubuntu@63.180.80.161
```

Expected behavior:

```text
ubuntu@<server-hostname>:~$
```

Never commit the `.pem` file to GitHub.

## 3. Update Ubuntu

Run:

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
```

Reconnect after the reboot:

```bash
ssh -i /path/to/key.pem ubuntu@63.180.80.161
```

## 4. Install Base Tools

Run:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release git unzip ufw htop jq build-essential
```

Expected checks:

```bash
git --version
curl --version
jq --version
```

## 5. Configure Firewall

AWS Lightsail has its own networking firewall, and Ubuntu can also run `ufw`.

Lightsail networking should allow:

```text
22/tcp    SSH
80/tcp    HTTP
443/tcp   HTTPS
```

Avoid publicly exposing:

```text
5432-5436 PostgreSQL
6379 Redis
8001-8005 Django service ports
30080 BDEN K3s NodePort gateway
18080 Optional Docker Compose smoke-test gateway
8080/8081 Jenkins
```

On Ubuntu:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

Expected output includes:

```text
Status: active
22/tcp ALLOW
80/tcp ALLOW
443/tcp ALLOW
```

If Jenkins needs browser access, prefer an SSH tunnel instead of opening Jenkins publicly:

```bash
ssh -i /path/to/key.pem -L 8081:localhost:8080 ubuntu@63.180.80.161
```

Then open `http://localhost:8081` locally.

## 6. Install Docker

Run:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker
docker version
docker compose version
```

Expected behavior:

```text
Client: Docker Engine
Docker Compose version ...
```

If `docker compose` is missing:

```bash
sudo apt install -y docker-compose-plugin
```

## 7. Install Host Nginx

TrashTrails already uses Django + Nginx, so Nginx may already be installed. Check first:

```bash
nginx -v
systemctl status nginx --no-pager
```

If missing:

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

Do not overwrite existing TrashTrails Nginx files. BDEN gets its own site file:

```text
/etc/nginx/sites-available/bden.hinkaku.tech
/etc/nginx/sites-enabled/bden.hinkaku.tech
```

## 8. Create Project Directory

Run:

```bash
sudo mkdir -p /var/www/BDEN
sudo chown -R ubuntu:ubuntu /var/www/BDEN
cd /var/www/BDEN
```

Expected:

```bash
pwd
```

```text
/var/www/BDEN
```

## 9. Clone The Repository

Run:

```bash
cd /var/www/BDEN
git clone https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git repo
cd repo
git checkout main
```

Expected:

```bash
git remote -v
git branch --show-current
```

```text
origin https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git
main
```

If the repository is private, use a GitHub deploy key or a fine-grained GitHub PAT.

## 10. Install K3s For Kubernetes Orchestration

BDEN production should be orchestrated by Kubernetes. On a single Lightsail VPS, use K3s because it is lightweight, production-friendly for small servers, and simpler than full kubeadm.

Install K3s without Traefik because host Nginx is already present for TrashTrails and will remain the public reverse proxy:

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik --write-kubeconfig-mode 644" sh -
```

Expected checks:

```bash
sudo systemctl status k3s --no-pager
kubectl get nodes
kubectl get pods -A
```

Expected behavior:

```text
NAME        STATUS   ROLES                  AGE   VERSION
<server>    Ready    control-plane,master    ...   v1.xx.x+k3s...
```

Create the BDEN namespace:

```bash
kubectl create namespace bden-prod
kubectl get namespace bden-prod
```

Expected:

```text
bden-prod Active
```

Give Jenkins access to `kubectl` later:

```bash
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo chmod 600 /var/lib/jenkins/.kube/config
```

If Jenkins is not installed yet, run the copy after the Jenkins installation step.

Important conflict note: do not install K3s Traefik on this server unless the team agrees to move all public routing away from host Nginx. TrashTrails already uses Nginx, so disabling Traefik avoids port `80`/`443` conflicts.

## 11. Create Production Environment File

Create:

```text
/var/www/BDEN/repo/.env.prod
```

Example:

```bash
nano /var/www/BDEN/repo/.env.prod
```

Template:

```dotenv
DEBUG=False
ALLOWED_HOSTS=bden.hinkaku.tech,63.180.80.161,auth-service,donor-service,request-service,campaign-service,notification-service
# Preferred domain mode
FRONTEND_URL=https://bden.hinkaku.tech
VITE_API_BASE_URL=https://bden.hinkaku.tech

# Temporary raw-IP mode if DNS/SSL is not ready yet
# FRONTEND_URL=http://63.180.80.161
# VITE_API_BASE_URL=http://63.180.80.161

AUTH_SECRET_KEY=replace-with-long-random-value
DONOR_SECRET_KEY=replace-with-long-random-value
REQUEST_SECRET_KEY=replace-with-long-random-value
CAMPAIGN_SECRET_KEY=replace-with-long-random-value
NOTIFICATION_SECRET_KEY=replace-with-long-random-value
INTERNAL_API_KEY=replace-with-long-random-value

AUTH_DB_NAME=bden_auth
AUTH_DB_USER=bden_user
AUTH_DB_PASSWORD=replace-with-strong-password
AUTH_DB_HOST=auth-db
AUTH_DB_PORT=5432

DONOR_DB_NAME=bden_donor
DONOR_DB_USER=bden_user
DONOR_DB_PASSWORD=replace-with-strong-password
DONOR_DB_HOST=donor-db
DONOR_DB_PORT=5432

REQUEST_DB_NAME=bden_request
REQUEST_DB_USER=bden_user
REQUEST_DB_PASSWORD=replace-with-strong-password
REQUEST_DB_HOST=request-db
REQUEST_DB_PORT=5432

CAMPAIGN_DB_NAME=bden_campaign
CAMPAIGN_DB_USER=bden_user
CAMPAIGN_DB_PASSWORD=replace-with-strong-password
CAMPAIGN_DB_HOST=campaign-db
CAMPAIGN_DB_PORT=5432

NOTIFICATION_DB_NAME=bden_notification
NOTIFICATION_DB_USER=bden_user
NOTIFICATION_DB_PASSWORD=replace-with-strong-password
NOTIFICATION_DB_HOST=notification-db
NOTIFICATION_DB_PORT=5432

REDIS_URL=redis://redis:6379/0
REDIS_CACHE_URL=redis://redis:6379/1
DEFAULT_MATCHING_RADIUS_KM=30
MAX_MATCHING_RADIUS_KM=100

ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7
JWT_ALGORITHM=HS256

GOOGLE_CLIENT_ID=replace-if-google-oauth-is-enabled
GOOGLE_CLIENT_SECRET=replace-if-google-oauth-is-enabled
GOOGLE_REDIRECT_URI=https://bden.hinkaku.tech/auth/google/callback
GOOGLE_AUTH_FRONTEND_CALLBACK_URL=https://bden.hinkaku.tech/auth/google/callback

# Raw-IP OAuth fallback for temporary testing only:
# GOOGLE_REDIRECT_URI=http://63.180.80.161/auth/google/callback
# GOOGLE_AUTH_FRONTEND_CALLBACK_URL=http://63.180.80.161/auth/google/callback

GEMINI_API_KEY=
GEMINI_MODEL_NAME=gemini-1.5-flash
```

Generate secrets:

```bash
openssl rand -base64 48
```

Protect the file:

```bash
chmod 600 /var/www/BDEN/repo/.env.prod
```

Never commit `.env.prod`.

## 12. Add Kubernetes Manifests

Create Kubernetes manifests under:

```text
infrastructure/k8s/
```

Recommended structure:

```text
infrastructure/k8s/
  namespace.yaml
  configmap.yaml
  secrets.example.yaml
  postgres-auth.yaml
  postgres-donor.yaml
  redis.yaml
  auth-service.yaml
  donor-service.yaml
  donor-event-consumer.yaml
  request-service.yaml
  campaign-service.yaml
  notification-service.yaml
  gateway.yaml
  jobs/
    migrate-auth.yaml
    migrate-donor.yaml
```

### `namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bden-prod
```

### `configmap.yaml`

Use a ConfigMap for non-secret settings:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bden-config
  namespace: bden-prod
data:
  DEBUG: "False"
  ALLOWED_HOSTS: "bden.hinkaku.tech,63.180.80.161,auth-service,donor-service,request-service,campaign-service,notification-service"
  FRONTEND_URL: "https://bden.hinkaku.tech"
  VITE_API_BASE_URL: "https://bden.hinkaku.tech"
  REDIS_URL: "redis://redis:6379/0"
  REDIS_CACHE_URL: "redis://redis:6379/1"
  ACCESS_TOKEN_LIFETIME_MINUTES: "60"
  REFRESH_TOKEN_LIFETIME_DAYS: "7"
  JWT_ALGORITHM: "HS256"
  GOOGLE_REDIRECT_URI: "https://bden.hinkaku.tech/auth/google/callback"
  GOOGLE_AUTH_FRONTEND_CALLBACK_URL: "https://bden.hinkaku.tech/auth/google/callback"
```

For raw-IP testing, temporarily use:

```yaml
  FRONTEND_URL: "http://63.180.80.161"
  VITE_API_BASE_URL: "http://63.180.80.161"
  GOOGLE_REDIRECT_URI: "http://63.180.80.161/auth/google/callback"
  GOOGLE_AUTH_FRONTEND_CALLBACK_URL: "http://63.180.80.161/auth/google/callback"
```

### `secrets.example.yaml`

Commit only an example file:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: bden-secrets
  namespace: bden-prod
type: Opaque
stringData:
  AUTH_SECRET_KEY: replace
  DONOR_SECRET_KEY: replace
  REQUEST_SECRET_KEY: replace
  CAMPAIGN_SECRET_KEY: replace
  NOTIFICATION_SECRET_KEY: replace
  INTERNAL_API_KEY: replace
  AUTH_DB_PASSWORD: replace
  DONOR_DB_PASSWORD: replace
  REQUEST_DB_PASSWORD: replace
  CAMPAIGN_DB_PASSWORD: replace
  NOTIFICATION_DB_PASSWORD: replace
  GOOGLE_CLIENT_ID: replace
  GOOGLE_CLIENT_SECRET: replace
```

Create the real secret directly on the VPS:

```bash
kubectl -n bden-prod create secret generic bden-secrets \
  --from-literal=AUTH_SECRET_KEY="$(openssl rand -base64 48)" \
  --from-literal=DONOR_SECRET_KEY="$(openssl rand -base64 48)" \
  --from-literal=REQUEST_SECRET_KEY="$(openssl rand -base64 48)" \
  --from-literal=CAMPAIGN_SECRET_KEY="$(openssl rand -base64 48)" \
  --from-literal=NOTIFICATION_SECRET_KEY="$(openssl rand -base64 48)" \
  --from-literal=INTERNAL_API_KEY="$(openssl rand -base64 48)" \
  --from-literal=AUTH_DB_PASSWORD="replace-with-strong-password" \
  --from-literal=DONOR_DB_PASSWORD="replace-with-strong-password" \
  --from-literal=REQUEST_DB_PASSWORD="replace-with-strong-password" \
  --from-literal=CAMPAIGN_DB_PASSWORD="replace-with-strong-password" \
  --from-literal=NOTIFICATION_DB_PASSWORD="replace-with-strong-password" \
  --from-literal=GOOGLE_CLIENT_ID="replace-if-enabled" \
  --from-literal=GOOGLE_CLIENT_SECRET="replace-if-enabled"
```

Expected:

```bash
kubectl -n bden-prod get secret bden-secrets
```

```text
NAME           TYPE     DATA
bden-secrets   Opaque   ...
```

### Workload Pattern

Each Django service should have:

```text
Deployment
ClusterIP Service
envFrom ConfigMap
envFrom Secret
readiness/liveness probes
```

Example `auth-service.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: bden-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: bden/auth-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8001
          envFrom:
            - configMapRef:
                name: bden-config
            - secretRef:
                name: bden-secrets
          env:
            - name: DJANGO_SETTINGS_MODULE
              value: config.settings.prod
            - name: AUTH_DB_HOST
              value: auth-db
          readinessProbe:
            httpGet:
              path: /health/
              port: 8001
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health/
              port: 8001
            initialDelaySeconds: 30
            periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: bden-prod
spec:
  type: ClusterIP
  selector:
    app: auth-service
  ports:
    - port: 8001
      targetPort: 8001
```

### Gateway Service

For a single VPS with host Nginx, expose the Kubernetes gateway with a NodePort bound only through host Nginx.

Recommended gateway Service:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: bden-gateway
  namespace: bden-prod
spec:
  type: NodePort
  selector:
    app: bden-gateway
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080
```

Then host Nginx proxies to:

```text
http://127.0.0.1:30080
```

Use this `30080` path consistently for production:

```text
Host Nginx -> 127.0.0.1:30080 -> K3s NodePort -> gateway pod
```

## 13. Add A Production Compose Overlay For Smoke Testing

Recommended file to create in the repository:

```text
docker-compose.prod.yml
```

Docker Compose is no longer the primary production orchestrator. Keep this overlay for smoke tests, emergency fallback, and comparing local/prod settings.

Purpose:

- use production Django settings
- avoid exposing databases and internal services publicly
- expose only the container gateway to `127.0.0.1:18080`
- keep the Compose project isolated from TrashTrails

Suggested content:

```yaml
services:
  auth-db:
    ports: []

  donor-db:
    ports: []

  request-db:
    ports: []

  campaign-db:
    ports: []

  notification-db:
    ports: []

  redis:
    ports: []

  auth-service:
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.prod
    ports: []

  donor-service:
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.prod
    ports: []

  donor-event-consumer:
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.prod

  request-service:
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.prod
    ports: []

  campaign-service:
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.prod
    ports: []

  notification-service:
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.prod
    ports: []

  nginx:
    ports:
      - "127.0.0.1:18080:80"

  jenkins:
    profiles:
      - local-jenkins
```

Expected behavior:

```bash
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml config --quiet
```

No output means the Compose config is valid.

## 14. First Manual Kubernetes Deploy

Build images locally on the VPS so K3s can use them without a registry:

```bash
cd /var/www/BDEN/repo
docker build -t bden/auth-service:latest services/auth-service
docker build -t bden/donor-service:latest services/donor-service
docker build -t bden/request-service:latest services/request-service
docker build -t bden/campaign-service:latest services/campaign-service
docker build -t bden/notification-service:latest services/notification-service
docker build -t bden/gateway:latest infrastructure/nginx
```

K3s uses containerd, so import Docker-built images:

```bash
docker save bden/auth-service:latest | sudo k3s ctr images import -
docker save bden/donor-service:latest | sudo k3s ctr images import -
docker save bden/request-service:latest | sudo k3s ctr images import -
docker save bden/campaign-service:latest | sudo k3s ctr images import -
docker save bden/notification-service:latest | sudo k3s ctr images import -
docker save bden/gateway:latest | sudo k3s ctr images import -
```

Expected:

```bash
sudo k3s ctr images ls | grep bden
```

Apply manifests:

```bash
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/configmap.yaml
kubectl apply -f infrastructure/k8s/
kubectl -n bden-prod get pods
```

Run migrations as Kubernetes Jobs:

```bash
kubectl apply -f infrastructure/k8s/jobs/migrate-auth.yaml
kubectl apply -f infrastructure/k8s/jobs/migrate-donor.yaml
kubectl -n bden-prod logs job/migrate-auth
kubectl -n bden-prod logs job/migrate-donor
```

Expected:

```text
No migrations to apply.
```

or:

```text
Applying ... OK
```

Check rollout:

```bash
kubectl -n bden-prod rollout status deployment/auth-service
kubectl -n bden-prod rollout status deployment/donor-service
kubectl -n bden-prod get svc
```

Expected:

```text
deployment "auth-service" successfully rolled out
deployment "donor-service" successfully rolled out
```

Check gateway through NodePort:

```bash
curl -i http://127.0.0.1:30080/
curl -i http://127.0.0.1:30080/health/auth/
curl -i http://127.0.0.1:30080/health/donor/
```

Expected:

```text
HTTP/1.1 200 OK
```

## 15. Optional Docker Compose Smoke Deploy

Run this only if you want to validate Compose parity or need an emergency non-Kubernetes fallback:

```bash
cd /var/www/BDEN/repo
docker compose --env-file .env.prod -p bden-prod -f docker-compose.yml -f docker-compose.prod.yml build
docker compose --env-file .env.prod -p bden-prod -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Expected:

```bash
docker compose -p bden-prod ps
```

You should see:

```text
auth-service      Up
donor-service     Up
request-service   Up
campaign-service  Up
notification-service Up
nginx             Up 127.0.0.1:18080->80/tcp
postgres services Up
redis             Up
```

Check the gateway from the VPS:

```bash
curl -i http://127.0.0.1:18080/
curl -i http://127.0.0.1:18080/health/auth/
curl -i http://127.0.0.1:18080/health/donor/
```

Expected:

```text
HTTP/1.1 200 OK
```

If migrations fail because of old local data, do not delete volumes casually on production. For MVP before production data exists, volume reset is acceptable only after team agreement:

```bash
docker compose -p bden-prod down
docker volume ls | grep bden-prod
```

Review volumes carefully before deleting anything.

## 16. Configure Host Nginx For BDEN

Create:

```bash
sudo nano /etc/nginx/sites-available/bden.hinkaku.tech
```

Content:

```nginx
server {
    listen 80;
    server_name bden.hinkaku.tech;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:30080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/bden.hinkaku.tech /etc/nginx/sites-enabled/bden.hinkaku.tech
sudo nginx -t
sudo systemctl reload nginx
```

Expected:

```text
syntax is ok
test is successful
```

Avoid touching the TrashTrails Nginx file.

If DNS is not ready and you need raw-IP HTTP access temporarily, create a second server block:

```nginx
server {
    listen 80;
    server_name 63.180.80.161;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:30080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Raw-IP mode is useful for early smoke testing but should not be the final production URL.

## 17. Install SSL With Certbot

Run:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bden.hinkaku.tech
```

Expected behavior:

- Certbot asks for an email.
- Certbot updates the BDEN Nginx server block.
- HTTPS becomes available.

Verify:

```bash
curl -I https://bden.hinkaku.tech/
```

Expected:

```text
HTTP/2 200
```

Check renewal:

```bash
sudo certbot renew --dry-run
```

## 18. Install Native Jenkins

Install Java:

```bash
sudo apt update
sudo apt install -y fontconfig openjdk-17-jre
java -version
```

Install Jenkins:

```bash
sudo mkdir -p /usr/share/keyrings
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins
sudo systemctl enable --now jenkins
sudo systemctl status jenkins --no-pager
```

Expected:

```text
Active: active (running)
```

Allow Jenkins to run Docker:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

Unlock Jenkins:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access safely with SSH tunnel:

```bash
ssh -i /path/to/key.pem -L 8081:localhost:8080 ubuntu@63.180.80.161
```

Then open:

```text
http://localhost:8081
```

Install suggested plugins plus:

```text
Git
GitHub
Pipeline
Docker Pipeline
Credentials Binding
AnsiColor
Workspace Cleanup
```

## 19. Prepare Jenkins Credentials

In Jenkins:

```text
Manage Jenkins -> Credentials -> System -> Global credentials
```

Recommended credentials:

```text
github-bden-token
  Type: Username with password or Secret text
  Purpose: checkout private repository and GitHub status updates

bden-prod-env
  Type: Secret file
  Purpose: production .env.prod if you want Jenkins to manage it

kubeconfig-bden-prod
  Type: Secret file
  Purpose: Kubernetes deployment access if you do not use /var/lib/jenkins/.kube/config
```

For a public repository, Jenkins may not need GitHub credentials for checkout, but credentials are still useful for webhook status reporting.

## 20. Jenkins Job Type

Use a Multibranch Pipeline if possible.

Recommended configuration:

```text
Job type: Multibranch Pipeline
Branch source: GitHub
Repository: AliceCressence/Blood-Donor-Emergency-Network-BDEN-
Discover branches: enabled
Discover pull requests from origin: enabled
Build strategies:
  - Build main branch
  - Build pull requests targeting main
Script path: Jenkinsfile
```

This supports:

```text
push to main -> build/test/deploy
PR to main   -> build/test only
```

If using a simple Pipeline job:

```text
Repository URL: https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git
Branch: */main
Script Path: Jenkinsfile
```

## 21. GitHub Webhook

In GitHub:

```text
Repository -> Settings -> Webhooks -> Add webhook
```

Payload URL:

```text
https://bden.hinkaku.tech/github-webhook/
```

That URL only works if you expose Jenkins through a secure Nginx route. If Jenkins is not public, use GitHub polling temporarily:

```text
Jenkins job -> Scan Multibranch Pipeline Triggers -> Periodically if not otherwise run
```

Suggested interval:

```text
5 minutes
```

Recommended secure Jenkins exposure is a separate subdomain:

```text
jenkins-bden.hinkaku.tech
```

Protect it with:

- HTTPS
- strong Jenkins admin password
- GitHub OAuth or Jenkins users
- firewall/IP allow-list if possible

Do not expose Jenkins casually on port `8080`.

## 22. Production Pipeline Order

The deployment pipeline should run in this order:

```text
1. Checkout
2. Backend syntax checks
3. Auth-service tests
4. Donor-service tests
5. Frontend install/build
6. Docker Compose config validation for compatibility
7. Build production images
8. Import or push images for K3s
9. Apply Kubernetes manifests
10. Run Kubernetes migration Jobs
11. Wait for rollout
12. Health checks
13. Mark build success/failure
```

PR builds should stop after step 6.

`main` builds may deploy after step 6.

## 23. Jenkinsfile Production Additions

The current Jenkinsfile already validates tests/build. To enable production deployment, add gated stages similar to this:

```groovy
stage('Build Production Images') {
    when {
        branch 'main'
    }
    steps {
        sh '''
          cd /var/www/BDEN/repo
          git fetch origin main
          git reset --hard origin/main
          docker build -t bden/auth-service:${BUILD_NUMBER} services/auth-service
          docker build -t bden/donor-service:${BUILD_NUMBER} services/donor-service
          docker build -t bden/request-service:${BUILD_NUMBER} services/request-service
          docker build -t bden/campaign-service:${BUILD_NUMBER} services/campaign-service
          docker build -t bden/notification-service:${BUILD_NUMBER} services/notification-service
          docker build -t bden/gateway:${BUILD_NUMBER} infrastructure/nginx
        '''
    }
}

stage('Import Images Into K3s') {
    when {
        branch 'main'
    }
    steps {
        sh '''
          cd /var/www/BDEN/repo
          docker save bden/auth-service:${BUILD_NUMBER} | sudo k3s ctr images import -
          docker save bden/donor-service:${BUILD_NUMBER} | sudo k3s ctr images import -
          docker save bden/request-service:${BUILD_NUMBER} | sudo k3s ctr images import -
          docker save bden/campaign-service:${BUILD_NUMBER} | sudo k3s ctr images import -
          docker save bden/notification-service:${BUILD_NUMBER} | sudo k3s ctr images import -
          docker save bden/gateway:${BUILD_NUMBER} | sudo k3s ctr images import -
        '''
    }
}

stage('Deploy To K3s') {
    when {
        branch 'main'
    }
    steps {
        sh '''
          cd /var/www/BDEN/repo
          kubectl apply -f infrastructure/k8s/
          kubectl -n bden-prod set image deployment/auth-service auth-service=bden/auth-service:${BUILD_NUMBER}
          kubectl -n bden-prod set image deployment/donor-service donor-service=bden/donor-service:${BUILD_NUMBER}
          kubectl -n bden-prod set image deployment/request-service request-service=bden/request-service:${BUILD_NUMBER}
          kubectl -n bden-prod set image deployment/campaign-service campaign-service=bden/campaign-service:${BUILD_NUMBER}
          kubectl -n bden-prod set image deployment/notification-service notification-service=bden/notification-service:${BUILD_NUMBER}
          kubectl -n bden-prod set image deployment/bden-gateway bden-gateway=bden/gateway:${BUILD_NUMBER}
          kubectl -n bden-prod rollout status deployment/auth-service
          kubectl -n bden-prod rollout status deployment/donor-service
        '''
    }
}

stage('Production Health Checks') {
    when {
        branch 'main'
    }
    steps {
        sh '''
          curl -fsS http://127.0.0.1:30080/
          curl -fsS http://127.0.0.1:30080/health/auth/
          curl -fsS http://127.0.0.1:30080/health/donor/
        '''
    }
}
```

Important: `git reset --hard` is appropriate only inside the VPS deployment checkout at `/var/www/BDEN/repo`, not in a developer workspace.

If you later add a container registry, replace the `docker save | k3s ctr images import` step with `docker push` and update manifests to use registry image names.

## 24. Permissions For Jenkins Deploy

Jenkins needs access to:

```text
/var/www/BDEN/repo
Docker socket
Kubeconfig
```

Run:

```bash
sudo chown -R jenkins:jenkins /var/www/BDEN/repo
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

If you also want the `ubuntu` user to work there:

```bash
sudo groupadd -f bden
sudo usermod -aG bden ubuntu
sudo usermod -aG bden jenkins
sudo chgrp -R bden /var/www/BDEN
sudo chmod -R g+rwX /var/www/BDEN
```

Log out and back in for group changes.

Allow Jenkins to use K3s:

```bash
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo chmod 600 /var/lib/jenkins/.kube/config
```

If Jenkins needs to import images into K3s with `sudo k3s ctr`, add a narrow sudoers rule:

```bash
sudo visudo -f /etc/sudoers.d/jenkins-k3s
```

Content:

```text
jenkins ALL=(root) NOPASSWD: /usr/local/bin/k3s ctr images import -
```

## 25. Google OAuth Production Callback

In Google Cloud Console, add:

```text
Authorized JavaScript origins:
https://bden.hinkaku.tech
http://63.180.80.161

Authorized redirect URIs:
https://bden.hinkaku.tech/auth/google/callback
http://63.180.80.161/auth/google/callback
```

Then set in `.env.prod` for domain mode:

```dotenv
GOOGLE_REDIRECT_URI=https://bden.hinkaku.tech/auth/google/callback
GOOGLE_AUTH_FRONTEND_CALLBACK_URL=https://bden.hinkaku.tech/auth/google/callback
```

For raw-IP smoke testing:

```dotenv
FRONTEND_URL=http://63.180.80.161
VITE_API_BASE_URL=http://63.180.80.161
GOOGLE_REDIRECT_URI=http://63.180.80.161/auth/google/callback
GOOGLE_AUTH_FRONTEND_CALLBACK_URL=http://63.180.80.161/auth/google/callback
```

Expected behavior:

- User clicks Google login.
- Google redirects to `https://bden.hinkaku.tech/auth/google/callback` in domain mode or `http://63.180.80.161/auth/google/callback` in raw-IP test mode.
- Frontend sends the code to `/api/auth/google/callback/`.
- Backend returns BDEN JWT tokens.

## 26. Logs And Debugging

Host Nginx:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

Kubernetes status:

```bash
kubectl -n bden-prod get pods
kubectl -n bden-prod get svc
kubectl -n bden-prod describe pod <pod-name>
```

Auth service:

```bash
kubectl -n bden-prod logs -f deployment/auth-service
```

Donor service:

```bash
kubectl -n bden-prod logs -f deployment/donor-service
```

Kubernetes gateway:

```bash
kubectl -n bden-prod logs -f deployment/bden-gateway
```

Node/container status:

```bash
kubectl get nodes
sudo k3s crictl ps
docker ps
```

## 27. Backups

Before real production data, decide where backups live.

Manual PostgreSQL backup example:

```bash
mkdir -p /var/backups/bden
docker compose -p bden-prod exec -T auth-db pg_dump -U bden_user bden_auth > /var/backups/bden/auth_$(date +%F).sql
docker compose -p bden-prod exec -T donor-db pg_dump -U bden_user bden_donor > /var/backups/bden/donor_$(date +%F).sql
```

Kubernetes backup example:

```bash
kubectl -n bden-prod exec statefulset/auth-db -- pg_dump -U bden_user bden_auth > /var/backups/bden/auth_$(date +%F).sql
kubectl -n bden-prod exec statefulset/donor-db -- pg_dump -U bden_user bden_donor > /var/backups/bden/donor_$(date +%F).sql
```

Automate later with cron:

```bash
sudo crontab -e
```

Example schedule:

```text
0 2 * * * /var/www/BDEN/repo/scripts/backup_prod.sh
```

Do not store backups only on the same VPS long-term. Copy them to S3, another server, or encrypted external storage.

## 28. Conflict Checklist With TrashTrails

Before deploying BDEN, check:

```bash
sudo nginx -T | grep -E "server_name|proxy_pass|listen"
sudo ss -tulpn | grep -E ":80|:443|:18080|:30080|:8080|:8000|:5432|:6379"
docker ps --format "table {{.Names}}\t{{.Ports}}"
kubectl get svc -A
```

Avoid:

- reusing TrashTrails domain names
- installing K3s Traefik on public `80`/`443` while host Nginx already owns those ports
- binding BDEN containers or NodePorts directly to public `80` or `443`
- exposing BDEN PostgreSQL or Redis ports publicly
- naming the Compose project the same as TrashTrails
- editing TrashTrails Nginx config while adding BDEN

Use:

```text
Kubernetes namespace: bden-prod
BDEN K3s NodePort gateway: 127.0.0.1:30080
BDEN domain: bden.hinkaku.tech
BDEN path: /var/www/BDEN
```

## 29. Final Verification Checklist

Run from the VPS:

```bash
curl -fsS http://127.0.0.1:30080/
curl -fsS http://127.0.0.1:30080/health/auth/
curl -fsS http://127.0.0.1:30080/health/donor/
```

Run from your laptop:

```bash
curl -I https://bden.hinkaku.tech/
curl -I https://bden.hinkaku.tech/health/auth/
curl -I http://63.180.80.161/
curl -I http://63.180.80.161/health/auth/
```

Browser checks:

```text
https://bden.hinkaku.tech
https://bden.hinkaku.tech/api/docs/swagger/
https://bden.hinkaku.tech/api/donor/docs/
https://bden.hinkaku.tech/django-admin/auth/
https://bden.hinkaku.tech/django-admin/donor/
http://63.180.80.161
http://63.180.80.161/api/docs/swagger/
```

CI/CD checks:

```text
Push to feature branch -> Jenkins PR/test pipeline runs
Open PR to main -> Jenkins test/build pipeline runs
Merge to main -> Jenkins test/build/deploy pipeline runs
Health checks pass after deploy
```

## 30. Rollback

If a deployment breaks:

```bash
cd /var/www/BDEN/repo
git log --oneline -5
git checkout <previous-good-commit>
docker build -t bden/auth-service:rollback services/auth-service
docker save bden/auth-service:rollback | sudo k3s ctr images import -
kubectl -n bden-prod set image deployment/auth-service auth-service=bden/auth-service:rollback
kubectl -n bden-prod rollout status deployment/auth-service
curl -fsS http://127.0.0.1:30080/health/auth/
```

Kubernetes also supports rolling back the previous ReplicaSet:

```bash
kubectl -n bden-prod rollout undo deployment/auth-service
kubectl -n bden-prod rollout status deployment/auth-service
```

For Jenkins, add a parameterized rollback job later:

```text
Parameter: GIT_COMMIT
Action: checkout commit -> build -> deploy -> health check
```

## 31. Team Agreement Before Next Service

Before implementing the next service, align with the team on:

- final production domain: `bden.hinkaku.tech`
- whether Jenkins is private over SSH tunnel or public behind `jenkins-bden.hinkaku.tech`
- final Kubernetes exposure strategy: host Nginx -> K3s NodePort `30080`, or K3s Ingress later
- who owns `.env.prod`
- backup destination
- rollback process
- GitHub branch protection rules for `main`

Recommended GitHub `main` protections:

```text
Require pull request before merging
Require Jenkins checks to pass
Require branch to be up to date before merging
Restrict direct pushes to main
```
