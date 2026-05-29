# BDEN — VPS Configuration Guide

> **Server:** AWS Lightsail Bitnami Django · `63.185.84.222`
> **Domain:** `bden.hinkaku.tech`
> **OS:** Bitnami Django image on Ubuntu/Debian · **User:** `bitnami` · **App root:** `/var/www/bden`

---

## What this document covers

Starting from a fresh SSH connection, this guide walks you both through every step needed to reach a fully running production pipeline:

```
git push / PR merge to main
  → GitHub Webhook
  → Jenkins (native, port 8090)
  → Build Docker images → Run tests → Push to Docker Hub
  → Deploy to k3s (bden-prod namespace)
  → Health check passes
```

### How to read this document

| Symbol | Meaning |
|--------|---------|
| ✅ **CHECK** | Verification step — do not skip |
| ⚠️ **WARNING** | Something that could break Apache/Nginx routing or lock you out |
| 📝 **NOTE** | Background explanation — useful for the report |
| `# Expected:` | What you should see after running a command |

> **Important:** Both team members should read this fully before touching the server. Only **one person** should execute each section — coordinate on Discord first.

---

## Table of Contents

1. [Before You Start](#section-0--before-you-start)
2. [System Preparation](#section-1--system-preparation)
3. [Firewall Configuration](#section-2--firewall-configuration)
4. [Docker Installation](#section-3--docker-installation)
5. [Clone the Repository](#section-4--clone-the-repository)
6. [Environment File](#section-5--environment-file)
7. [Kubernetes via k3s](#section-6--kubernetes-via-k3s)
8. [Nginx Configuration](#section-7--nginx-configuration)
9. [DNS and SSL Certificates](#section-8--dns-and-ssl-certificates)
10. [Jenkins — Native Installation](#section-9--jenkins--native-installation)
11. [GitHub Webhook](#section-10--github-webhook)
12. [The Jenkinsfile](#section-11--the-jenkinsfile)
13. [Docker Compose — Production Override](#section-12--docker-compose--production-override)
14. [Prometheus and Grafana](#section-13--prometheus-and-grafana)
15. [Ansible Playbooks](#section-14--ansible-playbooks)
16. [Deploy Script](#section-15--deploy-script)
17. [Pipeline Flow Summary](#section-16--pipeline-flow-summary)
18. [Kubernetes Manifests](#section-19--kubernetes-manifests)
19. [Team Workflow](#section-20--team-workflow)
20. [Documentation Screenshots](#section-21--documentation-screenshots)
21. [Maintenance Reference](#section-22--maintenance-and-ongoing-operations)
22. [Quick Reference Card](#section-23--quick-reference-card)
23. [Final Verification Checklist](#final-verification-checklist)
24. [Troubleshooting](#troubleshooting)

---

## Section 0 — Before You Start

Read this entirely before opening a terminal.

### 0.1 — SSH into the server

On your local machine (Windows: use Git Bash, WSL, or PowerShell):

```bash
ssh -i /path/to/your-key.pem bitnami@63.185.84.222
```

> **Expected:** `Welcome ... bitnami@ip-xxx:~$`

If you get a permissions error on the `.pem` file:

```bash
chmod 400 /path/to/your-key.pem
```

### 0.2 — Audit what is already running

> ⚠️ **WARNING:** Run all of these first and share the output with your teammate on Discord before doing anything else.

**What web servers are active?**
```bash
sudo ss -tlnp | grep -E '(:80|:443)'
sudo /opt/bitnami/ctlscript.sh status 2>/dev/null || true
systemctl status nginx --no-pager 2>/dev/null || true
```
> Bitnami images normally ship with Apache. If Apache still owns `80` or `443`, either stop/disable it or make sure it proxies to Nginx intentionally. Do not leave both Apache and Nginx competing for the same public ports.

**What ports are in use?**
```bash
sudo ss -tlnp | grep -E '(80|443|8080|8081|3000|3001|6379|5432)'
```
> Note which ports are occupied. You will assign BDEN services to ports that are NOT listed here.

**What Docker containers are running?**
```bash
docker ps
```

**Is k3s already installed?**
```bash
which k3s 2>/dev/null && echo "k3s found" || echo "k3s not installed"
```

**Is Jenkins already installed?**
```bash
which jenkins 2>/dev/null && echo "jenkins found" || echo "jenkins not installed"
```

### 0.3 — BDEN Port Assignment Plan

Public ports `80` and `443` should be owned by one public entry point only. For this guide, that entry point is host Nginx. BDEN's internal ports are never directly exposed to the internet.

| Service | Internal Port | Host Port |
|---------|--------------|-----------|
| auth-service | 8001 | — |
| donor-service | 8002 | — |
| request-service | 8003 | — |
| campaign-service | 8004 | — |
| notification-service | 8005 | — |
| PostgreSQL × 5 | 5432 (internal) | 5440–5444 |
| Redis | 6379 (internal) | 6380 |
| k3s API | 6443 | internal only |
| Jenkins | — | **8090** |
| Prometheus | — | 9091 |
| Grafana | — | **3002** |

> ⚠️ **WARNING:** If Bitnami Apache is still listening on `80` or `443`, Nginx will not be able to bind those ports. Resolve that before creating BDEN's public Nginx config.

---

## Section 1 — System Preparation

### 1.1 — Update system packages

```bash
sudo apt update && sudo apt upgrade -y
```

> **Expected:** Lines of upgrade output ending with `0 upgraded, 0 newly installed...` (numbers vary — no errors is what matters).

### 1.2 — Install essential tools

```bash
sudo apt install -y \
  git curl wget unzip htop net-tools \
  software-properties-common apt-transport-https \
  ca-certificates gnupg lsb-release \
  fail2ban ufw
```

✅ **CHECK:**
```bash
git --version    # git version 2.x.x
curl --version   # curl 7.x.x or 8.x.x
```

### 1.3 — Create the BDEN working directory

BDEN will live in `/var/www/bden`.

```bash
sudo mkdir -p /var/www/bden
sudo chown bitnami:bitnami /var/www/bden
```

✅ **CHECK:**
```bash
ls /var/www/
# Expected: bden
```

### 1.4 — Set timezone

```bash
sudo timedatectl set-timezone Africa/Douala
```

✅ **CHECK:**
```bash
timedatectl
# Expected: Time zone: Africa/Douala (WAT, +0100)
```

---

## Section 2 — Firewall Configuration

We configure UFW at the OS level. Lightsail also has its own firewall in the AWS console — **configure both**.

> ⚠️ **WARNING:** Do not run `ufw enable` before adding the SSH rule or you will lock yourself out of the server permanently.

### 2.1 — Check current UFW status

```bash
sudo ufw status
```

If it shows `Status: active`, rules are already in place. If `Status: inactive`, set it up from scratch below.

### 2.2 — Set default policies and add rules

```bash
# SSH — MUST be added first
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   comment 'SSH'

# Web traffic — Nginx handles routing
sudo ufw allow 80/tcp   comment 'HTTP'
sudo ufw allow 443/tcp  comment 'HTTPS'

# BDEN-specific public ports
sudo ufw allow 8090/tcp comment 'Jenkins'
sudo ufw allow 3002/tcp comment 'Grafana'

# Enable (safe now because SSH is already allowed)
sudo ufw enable
```

> Type `y` when prompted.

✅ **CHECK:**
```bash
sudo ufw status verbose
```

Expected output includes:
```
22/tcp    ALLOW IN
80/tcp    ALLOW IN
443/tcp   ALLOW IN
8090/tcp  ALLOW IN
3002/tcp  ALLOW IN
```

### 2.3 — Lightsail Console Firewall

In your browser: **AWS Console → Lightsail → your instance → Networking tab → IPv4 Firewall**

Add these rules (click **+ Add rule** for each):

| Application | Protocol | Port |
|-------------|----------|------|
| Custom | TCP | 22 |
| HTTP | TCP | 80 |
| HTTPS | TCP | 443 |
| Custom | TCP | 8090 (Jenkins) |
| Custom | TCP | 3002 (Grafana) |

> ⚠️ **Do NOT open** ports 8001–8005, 5440–5444, or 6380. Those are internal service ports. Nginx is the only public entry point.

### 2.4 — Enable fail2ban

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

✅ **CHECK:**
```bash
sudo systemctl status fail2ban
# Expected: Active: active (running)
```

---

## Section 3 — Docker Installation

> 📝 **NOTE:** This is a virgin Bitnami Django instance, so Docker is probably not installed yet. Run the check first anyway.

### 3.1 — Check if Docker is already installed

```bash
docker --version 2>/dev/null \
  && echo "Docker already installed — skip to 3.5" \
  || echo "Docker not found — proceed with installation"
```

### 3.2 — Add Docker's official GPG key and repository

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 3.3 — Install Docker Engine and Compose plugin

```bash
sudo apt update
sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin
```

### 3.4 — Add bitnami user to docker group

```bash
sudo usermod -aG docker bitnami
```

> ⚠️ You must **log out and back in** for this to take effect:
> ```bash
> exit
> ssh -i /path/to/your-key.pem bitnami@63.185.84.222
> ```

### 3.5 — Enable Docker on boot

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

✅ **CHECK:**
```bash
docker --version          # Docker version 24.x.x or higher
docker compose version    # Docker Compose version v2.x.x
docker run hello-world    # Should print "Hello from Docker!"
```

---

## Section 4 — Clone the Repository

### 4.1 — Generate an SSH deploy key for GitHub

This key lets the server pull from GitHub without a password. It is **read-only** — it cannot push or modify the repository.

```bash
ssh-keygen -t ed25519 \
  -C "bden-vps-deploy@hinkaku.tech" \
  -f ~/.ssh/bden_github \
  -N ""
```

> **Expected:** Two files created:
> - `~/.ssh/bden_github` — private key (stays on server)
> - `~/.ssh/bden_github.pub` — public key (goes to GitHub)

### 4.2 — Display and copy the public key

```bash
cat ~/.ssh/bden_github.pub
```

Copy the entire output (starts with `ssh-ed25519 ...`).

### 4.3 — Add the key to GitHub

In your browser:

1. Go to `GitHub → AliceCressence/Blood-Donor-Emergency-Network-BDEN-`
2. **Settings → Deploy keys → Add deploy key**
3. Title: `bden-vps-production`
4. Key: paste the output from 4.2
5. **Allow write access: ✗** (leave unchecked — read-only is enough)
6. Click **Add key**

### 4.4 — Configure SSH to use this key for GitHub

```bash
cat >> ~/.ssh/config << 'EOF'
Host github-bden
  HostName github.com
  User git
  IdentityFile ~/.ssh/bden_github
  StrictHostKeyChecking no
EOF
```

### 4.5 — Test the connection

```bash
ssh -T github-bden
```

> **Expected:** `Hi AliceCressence! You've successfully authenticated, but GitHub does not provide shell access.`

### 4.6 — Clone the repository

```bash
cd /var/www/bden
git clone git@github-bden:AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git .
```

✅ **CHECK:**
```bash
ls /var/www/bden
# Expected: services/  infrastructure/  frontend/  Jenkinsfile  docker-compose.yml ...
```

### 4.7 — Set correct ownership

```bash
sudo chown -R bitnami:bitnami /var/www/bden
```

---

## Section 5 — Environment File

> ⚠️ **WARNING:** The `.env` file is **never** committed to GitHub. It lives only on the server at `/var/www/bden/.env`. Share values with your teammate via Discord DM — not in any public channel or commit.

### 5.1 — Create and fill the production `.env`

```bash
cp /var/www/bden/.env.example /var/www/bden/.env
nano /var/www/bden/.env
```

Key fields to fill in for production:

```dotenv
DEBUG=False
ALLOWED_HOSTS=bden.hinkaku.tech,63.185.84.222

# Generate each secret key with:
# python3 -c "import secrets; print(secrets.token_urlsafe(50))"
AUTH_SECRET_KEY=<generated>
DONOR_SECRET_KEY=<generated>
REQUEST_SECRET_KEY=<generated>
CAMPAIGN_SECRET_KEY=<generated>
NOTIFICATION_SECRET_KEY=<generated>

# Database — host is the Docker service name, port is the internal port
AUTH_DB_HOST=auth-db
AUTH_DB_PORT=5432
AUTH_DB_PASSWORD=<strong password>
# ... same pattern for donor, request, campaign, notification DBs

REDIS_URL=redis://redis:6379/0   # internal Docker port, not host port 6380

GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=https://bden.hinkaku.tech/auth/google/callback

GEMINI_API_KEY=<placeholder for now>

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=<your Gmail>
EMAIL_HOST_PASSWORD=<Gmail app password>

# Generate with: python3 -c "import secrets; print(secrets.token_urlsafe(64))"
INTERNAL_API_KEY=<generated>

FRONTEND_URL=https://bden.hinkaku.tech
```

### 5.2 — Secure the file

```bash
chmod 600 /var/www/bden/.env
```

✅ **CHECK:**
```bash
ls -la /var/www/bden/.env
# Expected: -rw------- 1 bitnami bitnami ... .env
```

---

## Section 6 — Kubernetes via k3s

> 📝 **NOTE:** k3s is a lightweight certified Kubernetes distribution that installs in a single command. It is fully compatible with standard Kubernetes manifests and designed for exactly this kind of single-VPS deployment.

### 6.1 — Check if k3s is already installed

```bash
which k3s 2>/dev/null && echo "k3s found — skip to 6.4" || echo "k3s not installed"
```

### 6.2 — Install k3s

The `--write-kubeconfig-mode 644` flag makes the config readable by the `bitnami` user without `sudo`.

```bash
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
```

> Takes 30–60 seconds. Expected output ends with: `[INFO] systemd: Starting k3s`

### 6.3 — Wait for k3s to be ready

```bash
sudo systemctl status k3s
# Expected: Active: active (running)
```

### 6.4 — Configure kubectl for the bitnami user

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown bitnami:bitnami ~/.kube/config
echo 'export KUBECONFIG=$HOME/.kube/config' >> ~/.bashrc
source ~/.bashrc
```

✅ **CHECK:**
```bash
kubectl get nodes
```

Expected:
```
NAME                STATUS   ROLES                  AGE   VERSION
ip-xxx-xxx-xxx-xxx  Ready    control-plane,master   1m    v1.xx.x+k3s1
```

> `STATUS` must be `Ready` before proceeding. If it shows `NotReady`, wait 30 more seconds and retry.

### 6.5 — Create Kubernetes namespaces

```bash
kubectl create namespace bden-prod
kubectl create namespace bden-monitoring
```

✅ **CHECK:**
```bash
kubectl get namespaces
# Expected: bden-prod and bden-monitoring appear in the list
```

### 6.6 — Create Kubernetes Secrets

These are the same values as your `.env` file but stored securely inside the Kubernetes cluster. Pods read from these secrets — they never see the `.env` file directly. Replace every `<value>` with the actual secret.

```bash
kubectl create secret generic bden-secrets \
  --namespace=bden-prod \
  --from-literal=AUTH_SECRET_KEY='<your-auth-secret-key>' \
  --from-literal=DONOR_SECRET_KEY='<your-donor-secret-key>' \
  --from-literal=REQUEST_SECRET_KEY='<your-request-secret-key>' \
  --from-literal=CAMPAIGN_SECRET_KEY='<your-campaign-secret-key>' \
  --from-literal=NOTIFICATION_SECRET_KEY='<your-notification-secret-key>' \
  --from-literal=AUTH_DB_PASSWORD='<your-db-password>' \
  --from-literal=DONOR_DB_PASSWORD='<your-db-password>' \
  --from-literal=REQUEST_DB_PASSWORD='<your-db-password>' \
  --from-literal=CAMPAIGN_DB_PASSWORD='<your-db-password>' \
  --from-literal=NOTIFICATION_DB_PASSWORD='<your-db-password>' \
  --from-literal=INTERNAL_API_KEY='<your-internal-api-key>' \
  --from-literal=GOOGLE_CLIENT_ID='<your-google-client-id>' \
  --from-literal=GOOGLE_CLIENT_SECRET='<your-google-client-secret>' \
  --from-literal=GEMINI_API_KEY='<placeholder>' \
  --from-literal=EMAIL_HOST_PASSWORD='<your-gmail-app-password>'
```

✅ **CHECK:**
```bash
kubectl get secrets -n bden-prod
# Expected: bden-secrets   Opaque   15   ...
```

### 6.7 — Install Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

✅ **CHECK:**
```bash
helm version
# Expected: version.BuildInfo{Version:"v3.x.x", ...}
```

---

## Section 7 — Nginx Configuration

> ⚠️ **WARNING:** The Bitnami Django image ships with Apache. Your public entry point should be either Apache or Nginx, not both fighting over ports `80` and `443`. This guide assumes you have moved public traffic to Nginx, or Apache is only proxying to Nginx intentionally.
>
> Important SSL rule: do **not** add `listen 443 ssl`, `ssl_certificate`, or `ssl_certificate_key` before certificates exist. That is exactly why web server config tests fail. Start with HTTP-only routing, get the config test green, then run the SSL tool.

### 7.1 — Inspect Apache and Nginx

```bash
sudo ss -tlnp | grep -E '(:80|:443)'
sudo /opt/bitnami/ctlscript.sh status 2>/dev/null || true
nginx -v
sudo systemctl status nginx --no-pager
```

Expected behavior:

- `nginx` is installed.
- Nginx should be the process listening on public `80` and later `443`.
- If `apache`/`httpd` is still listening on `80` or `443`, stop it before testing Nginx:

```bash
sudo /opt/bitnami/ctlscript.sh stop apache
sudo /opt/bitnami/ctlscript.sh status
```

If you want Apache permanently disabled on this virgin BDEN instance:

```bash
sudo mv /opt/bitnami/apache2/scripts/ctl.sh /opt/bitnami/apache2/scripts/ctl.sh.disabled
```

> 📝 If you prefer to keep Apache as the public server and proxy Apache to Nginx, do not use the Nginx `listen 80/443` config below. Pick one public reverse proxy and keep the setup simple.
>
> 📝 This guide uses Ubuntu package Nginx paths: `/etc/nginx/sites-available` and `/etc/nginx/sites-enabled`. If you are using Bitnami's bundled Nginx instead, create the server block under `/opt/bitnami/nginx/conf/server_blocks/bden.conf` and reload it with `sudo /opt/bitnami/ctlscript.sh reload nginx`.

### 7.2 — Create HTTP-only BDEN Nginx config

This config intentionally has **no SSL lines yet**. It exists so `nginx -t` can pass before certificates are created.

```bash
sudo tee /etc/nginx/sites-available/bden > /dev/null << 'EOF'
server {
    listen 80;
    server_name bden.hinkaku.tech 63.185.84.222;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:30080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}

server {
    listen 80;
    server_name jenkins.bden.hinkaku.tech;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_request_buffering off;
        proxy_read_timeout 90s;
    }
}

server {
    listen 80;
    server_name grafana.bden.hinkaku.tech;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### 7.3 — Enable the BDEN site

```bash
sudo ln -sf /etc/nginx/sites-available/bden /etc/nginx/sites-enabled/bden
```

### 7.4 — Test Nginx config

> ⚠️ **Always** test before reloading. At this stage the test should not complain about missing certificate files, because the config is HTTP-only.

```bash
sudo nginx -t
```

Expected:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

If you get an error — **do not reload**. Fix the error first, then re-test.

### 7.5 — Reload Nginx (only after test passes)

```bash
sudo systemctl reload nginx
```

✅ **CHECK:**
```bash
curl -I http://bden.hinkaku.tech
# Expected: HTTP/1.1 200 OK or HTTP/1.1 502 Bad Gateway
# 502 is acceptable before the Kubernetes gateway is running.
```

---

## Section 8 — DNS and SSL Certificates

### 8.1 — Add DNS records

In your domain registrar, update or create these A records so they point to the new Bitnami instance `63.185.84.222`:

| Type | Name | Value |
|------|------|-------|
| A | `bden` | `63.185.84.222` |
| A | `jenkins.bden` | `63.185.84.222` |
| A | `grafana.bden` | `63.185.84.222` |

DNS propagation usually takes 5–30 minutes. Check with:

```bash
dig bden.hinkaku.tech +short
dig jenkins.bden.hinkaku.tech +short
dig grafana.bden.hinkaku.tech +short
# Expected for each: 63.185.84.222
```

### 8.2 — Choose One SSL Manager

Because this is a Bitnami Django instance, the recommended SSL manager is Bitnami's built-in `bncert-tool`.

Use **bncert-tool** when:

- Apache is still the Bitnami-managed public server.
- You are using Bitnami's bundled web stack.
- You want the simplest Bitnami-supported certificate setup.

Use **Certbot** only when:

- You intentionally installed and use Ubuntu package Nginx from `/etc/nginx`.
- Nginx owns public ports `80` and `443`.
- Apache is stopped or permanently disabled.

> ⚠️ Do not mix `bncert-tool` and `certbot --nginx` casually. Pick one tool for this server. Since this VPS is Bitnami, use `bncert-tool` unless you have fully replaced Apache with system Nginx.

### 8.3 — Recommended: Obtain SSL With Bitnami bncert-tool

> ⚠️ DNS records **must** resolve to `63.185.84.222` before running this. The tool will fail if the domains still point to the old VPS or do not resolve.

Check that the tool exists:

```bash
sudo /opt/bitnami/bncert-tool --help
```

Run it:

```bash
sudo /opt/bitnami/bncert-tool
```

When prompted for domains, enter:

```text
bden.hinkaku.tech jenkins.bden.hinkaku.tech grafana.bden.hinkaku.tech
```

Recommended answers:

```text
Enable HTTP to HTTPS redirection: Y
Enable non-www to www redirection: N
Enable www to non-www redirection: N
Agree to Let's Encrypt Subscriber Agreement: Y
Email: your real team/admin email
```

Expected behavior:

```text
Success
The certificates were successfully installed
```

Verify Bitnami certificate status:

```bash
sudo /opt/bitnami/ctlscript.sh restart
sudo /opt/bitnami/ctlscript.sh status
sudo /opt/bitnami/letsencrypt/certbot certificates 2>/dev/null || sudo certbot certificates
```

Verify HTTPS:

```bash
curl -I https://bden.hinkaku.tech
curl -I https://jenkins.bden.hinkaku.tech
curl -I https://grafana.bden.hinkaku.tech
```

Expected:

```text
HTTP/2 200
```

or:

```text
HTTP/2 502
```

`502` is acceptable before the BDEN Kubernetes gateway, Jenkins, or Grafana are running. It means TLS worked and the reverse proxy reached the upstream phase.

### 8.4 — If Apache Is Public: Add Bitnami Apache Reverse Proxy Rules

If `bncert-tool` keeps Apache as the public TLS endpoint, Apache should proxy traffic to the internal BDEN services.

Create a BDEN vhost file:

```bash
sudo tee /opt/bitnami/apache/conf/vhosts/bden-vhost.conf > /dev/null << 'EOF'
<VirtualHost *:80>
    ServerName bden.hinkaku.tech
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:30080/
    ProxyPassReverse / http://127.0.0.1:30080/
</VirtualHost>

<VirtualHost *:80>
    ServerName jenkins.bden.hinkaku.tech
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:8090/
    ProxyPassReverse / http://127.0.0.1:8090/
</VirtualHost>

<VirtualHost *:80>
    ServerName grafana.bden.hinkaku.tech
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3002/
    ProxyPassReverse / http://127.0.0.1:3002/
</VirtualHost>
EOF
```

After running `bncert-tool`, it may create HTTPS vhost files automatically. If it does not, create this SSL vhost too:

```bash
sudo tee /opt/bitnami/apache/conf/vhosts/bden-https-vhost.conf > /dev/null << 'EOF'
<VirtualHost *:443>
    ServerName bden.hinkaku.tech
    SSLEngine on
    SSLCertificateFile "/opt/bitnami/apache/conf/bitnami/certs/server.crt"
    SSLCertificateKeyFile "/opt/bitnami/apache/conf/bitnami/certs/server.key"
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    ProxyPass / http://127.0.0.1:30080/
    ProxyPassReverse / http://127.0.0.1:30080/
</VirtualHost>

<VirtualHost *:443>
    ServerName jenkins.bden.hinkaku.tech
    SSLEngine on
    SSLCertificateFile "/opt/bitnami/apache/conf/bitnami/certs/server.crt"
    SSLCertificateKeyFile "/opt/bitnami/apache/conf/bitnami/certs/server.key"
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    ProxyPass / http://127.0.0.1:8090/
    ProxyPassReverse / http://127.0.0.1:8090/
</VirtualHost>

<VirtualHost *:443>
    ServerName grafana.bden.hinkaku.tech
    SSLEngine on
    SSLCertificateFile "/opt/bitnami/apache/conf/bitnami/certs/server.crt"
    SSLCertificateKeyFile "/opt/bitnami/apache/conf/bitnami/certs/server.key"
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    ProxyPass / http://127.0.0.1:3002/
    ProxyPassReverse / http://127.0.0.1:3002/
</VirtualHost>
EOF
```

Test and restart Apache:

```bash
sudo /opt/bitnami/apache/bin/apachectl -t
sudo /opt/bitnami/ctlscript.sh restart apache
```

Expected:

```text
Syntax OK
```

### 8.5 — Alternative: Certbot For System Nginx Only

Use this path only if you are sure system Nginx owns public ports `80` and `443`.

```bash
which certbot 2>/dev/null \
  && echo "Certbot already installed" \
  || sudo apt install -y certbot python3-certbot-nginx
```

Then run:

```bash
sudo certbot --nginx \
  -d bden.hinkaku.tech \
  -d jenkins.bden.hinkaku.tech \
  -d grafana.bden.hinkaku.tech \
  --email dev@hinkaku.tech \
  --agree-tos \
  --non-interactive
```

Re-test Nginx after Certbot edits it:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 8.6 — Verify Auto-Renewal

For Bitnami `bncert-tool`, check the renewal timer or cron entry:

```bash
sudo crontab -l
sudo /opt/bitnami/letsencrypt/certbot renew --dry-run 2>/dev/null || sudo certbot renew --dry-run
```

For system Nginx/Certbot:

```bash
sudo certbot renew --dry-run
```

✅ **CHECK:**
```bash
curl -I https://bden.hinkaku.tech
# Expected: HTTP/2 200 or 502
# 502 is fine — backend containers aren't running yet, but HTTPS handshake succeeded
```

---

## Section 9 — Jenkins — Native Installation

> 📝 **NOTE:** Native Jenkins (system service) is more stable for production than Docker-based Jenkins on the same machine that also runs Docker builds. It has direct access to Docker and kubectl without socket mounting complications.

### 9.1 — Install Java

```bash
sudo apt update
sudo apt install -y fontconfig openjdk-17-jre
```

✅ **CHECK:**
```bash
java -version
# Expected: openjdk version "17.x.x" ...
```

### 9.2 — Add Jenkins repository and install

```bash
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key \
  | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update
sudo apt install -y jenkins
```

### 9.3 — Change Jenkins port from 8080 to 8090

Port `8080` may already be in use on the VPS.

```bash
sudo mkdir -p /etc/systemd/system/jenkins.service.d
sudo tee /etc/systemd/system/jenkins.service.d/override.conf > /dev/null << 'EOF'
[Service]
Environment="JENKINS_PORT=8090"
EOF

sudo systemctl daemon-reload
```

### 9.4 — Give Jenkins access to Docker and kubectl

```bash
sudo usermod -aG docker jenkins

# Copy kubeconfig so Jenkins can run kubectl
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
```

### 9.5 — Enable and start Jenkins

```bash
sudo systemctl enable jenkins
sudo systemctl start jenkins
```

✅ **CHECK** (wait ~60 seconds for Jenkins to start):
```bash
sudo systemctl status jenkins
# Expected: Active: active (running)

curl -I http://localhost:8090
# Expected: HTTP/1.1 403 Forbidden  ← 403 means Jenkins is up and needs login
```

### 9.6 — Get initial admin password

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Copy this password — you need it for the next step.

### 9.7 — Jenkins initial setup in browser

Open `https://jenkins.bden.hinkaku.tech` (or `http://63.185.84.222:8090` if DNS is not ready yet).

1. Enter the password from step 9.6
2. Click **Install suggested plugins** — wait for all to install
3. Create your admin account:
   - Username: `bden-admin`
   - Password: choose something strong
   - Full name: `BDEN Team`
   - Email: your email
4. Jenkins URL: `https://jenkins.bden.hinkaku.tech`
5. Click **Save and Finish → Start using Jenkins**

### 9.8 — Install additional required plugins

Go to **Dashboard → Manage Jenkins → Plugins → Available plugins** and install each of these:

- `Pipeline`
- `Git`
- `Docker Pipeline`
- `Docker plugin`
- `GitHub Integration`
- `GitHub plugin`
- `Kubernetes CLI`
- `Pipeline: Stage View`
- `AnsiColor`
- `Timestamper`
- `Blue Ocean` *(optional — much better pipeline UI)*

After installing, check **"Restart Jenkins when installation is complete"**.

### 9.9 — Configure Jenkins Credentials

Go to **Dashboard → Manage Jenkins → Credentials → System → Global credentials → Add Credentials**.

**Credential 1 — Docker Hub**

| Field | Value |
|-------|-------|
| Kind | Username with password |
| Username | your Docker Hub username |
| Password | Docker Hub access token *(create at hub.docker.com → Account Settings → Security → New Access Token)* |
| ID | `dockerhub-credentials` |

**Credential 2 — GitHub PAT** *(if repo is private)*

| Field | Value |
|-------|-------|
| Kind | Username with password |
| Username | `AliceCressence` |
| Password | GitHub Personal Access Token with `repo` scope |
| ID | `github-credentials` |

**Credential 3 — Kubeconfig**

| Field | Value |
|-------|-------|
| Kind | Secret file |
| File | Upload `/var/lib/jenkins/.kube/config` *(copy it to your local machine first via `scp`)* |
| ID | `kubeconfig` |

### 9.10 — Create the BDEN pipeline job

Go to **Dashboard → New Item**, name it `BDEN-Pipeline`, select **Pipeline**, click **OK**.

In the configuration page:

**General:**
- ✓ GitHub project
- Project URL: `https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-/`

**Build Triggers:**
- ✓ GitHub hook trigger for GITScm polling

**Pipeline:**
- Definition: `Pipeline script from SCM`
- SCM: `Git`
- Repository URL: `https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git`
- Credentials: `github-credentials` (if private repo)
- Branch Specifier: `*/main`
- Script Path: `Jenkinsfile`

Click **Save**.

✅ **CHECK:** Click **Build Now** in the BDEN-Pipeline job. The pipeline should run and show stages in Stage View. Deployment stages will be skipped until containers are up.

---

## Section 10 — GitHub Webhook

This is what makes Jenkins automatically trigger when you push to `main` or merge a PR.

### 10.1 — Add webhook in GitHub

Go to **GitHub → your repo → Settings → Webhooks → Add webhook**.

| Field | Value |
|-------|-------|
| Payload URL | `https://jenkins.bden.hinkaku.tech/github-webhook/` |
| Content type | `application/json` |
| Secret | *(leave blank for now)* |
| Which events | **Let me select individual events** → ✓ Pushes, ✓ Pull requests |
| Active | ✓ |

Click **Add webhook**. GitHub immediately sends a ping — you should see a green checkmark within a few seconds.

### 10.2 — Verify webhook delivery

In GitHub: **Settings → Webhooks → click your webhook → Recent Deliveries**

You should see a ping event with response code `200`.

> 📝 **How triggers work:**
> - **Pushes** → fires on direct push to `main` (emergency hotfix)
> - **Pull requests** → fires when a PR is opened, updated, or merged into `main` (standard workflow)
>
> Together they cover both your required scenarios.

---

## Section 11 — The Jenkinsfile

This file lives in the **root of your repository** and defines the complete CI/CD pipeline. Commit and push it to `main`.

**Pipeline stages in order:**

| # | Stage | Description |
|---|-------|-------------|
| 1 | Checkout | Clone the triggering commit |
| 2 | Lint & Syntax | Python `py_compile` check on all services |
| 3 | Test: Auth | `pytest` for auth-service |
| 4 | Test: Donor | `pytest` for donor-service |
| 5 | Build Frontend | `npm ci` + `vite build` |
| 6 | Build Images | `docker build` all 5 services in parallel |
| 7 | Push Images | Push to Docker Hub *(main branch only)* |
| 8 | Deploy to k3s | `kubectl apply` + rollout *(main branch only)* |
| 9 | Health Check | `curl /health/` on the gateway *(main branch only)* |

Save this as `Jenkinsfile` in the repo root:

```groovy
pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_REPO        = 'your-dockerhub-username'
        KUBECONFIG            = credentials('kubeconfig')
        K8S_NAMESPACE         = 'bden-prod'
        COMPOSE_FILE          = 'docker-compose.yml'
    }

    options {
        ansiColor('xterm')
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'echo "Building commit: $(git rev-parse --short HEAD)"'
                sh 'echo "Branch: $GIT_BRANCH"'
            }
        }

        stage('Lint & Syntax Check') {
            steps {
                sh '''
                    echo "=== Python syntax checks ==="
                    find services/ -name "*.py" | xargs python3 -m py_compile
                    echo "All Python files passed syntax check."
                '''
            }
        }

        stage('Test: Auth Service') {
            steps {
                sh '''
                    docker compose -f ${COMPOSE_FILE} run --rm \
                      -e DJANGO_SETTINGS_MODULE=config.settings.local \
                      auth-service \
                      pytest --tb=short --cov=. --cov-report=term-missing
                '''
            }
            post {
                always {
                    sh 'docker compose -f ${COMPOSE_FILE} rm -f auth-service || true'
                }
            }
        }

        stage('Test: Donor Service') {
            steps {
                sh '''
                    docker compose -f ${COMPOSE_FILE} run --rm \
                      -e DJANGO_SETTINGS_MODULE=config.settings.local \
                      donor-service \
                      pytest --tb=short --cov=. --cov-report=term-missing
                '''
            }
            post {
                always {
                    sh 'docker compose -f ${COMPOSE_FILE} rm -f donor-service || true'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    cd frontend
                    npm ci
                    npm run build
                    echo "Frontend build complete. dist/ size:"
                    du -sh dist/
                '''
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('auth-service') {
                    steps {
                        sh 'docker build -t ${DOCKERHUB_REPO}/bden-auth:${BUILD_NUMBER} services/auth-service'
                        sh 'docker tag ${DOCKERHUB_REPO}/bden-auth:${BUILD_NUMBER} ${DOCKERHUB_REPO}/bden-auth:latest'
                    }
                }
                stage('donor-service') {
                    steps {
                        sh 'docker build -t ${DOCKERHUB_REPO}/bden-donor:${BUILD_NUMBER} services/donor-service'
                        sh 'docker tag ${DOCKERHUB_REPO}/bden-donor:${BUILD_NUMBER} ${DOCKERHUB_REPO}/bden-donor:latest'
                    }
                }
                stage('request-service') {
                    steps {
                        sh 'docker build -t ${DOCKERHUB_REPO}/bden-request:${BUILD_NUMBER} services/request-service'
                        sh 'docker tag ${DOCKERHUB_REPO}/bden-request:${BUILD_NUMBER} ${DOCKERHUB_REPO}/bden-request:latest'
                    }
                }
                stage('campaign-service') {
                    steps {
                        sh 'docker build -t ${DOCKERHUB_REPO}/bden-campaign:${BUILD_NUMBER} services/campaign-service'
                        sh 'docker tag ${DOCKERHUB_REPO}/bden-campaign:${BUILD_NUMBER} ${DOCKERHUB_REPO}/bden-campaign:latest'
                    }
                }
                stage('notification-service') {
                    steps {
                        sh 'docker build -t ${DOCKERHUB_REPO}/bden-notification:${BUILD_NUMBER} services/notification-service'
                        sh 'docker tag ${DOCKERHUB_REPO}/bden-notification:${BUILD_NUMBER} ${DOCKERHUB_REPO}/bden-notification:latest'
                    }
                }
            }
        }

        stage('Push Images to Docker Hub') {
            when { branch 'main' }
            steps {
                sh 'echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin'
                sh '''
                    for svc in auth donor request campaign notification; do
                        docker push ${DOCKERHUB_REPO}/bden-${svc}:${BUILD_NUMBER}
                        docker push ${DOCKERHUB_REPO}/bden-${svc}:latest
                    done
                '''
            }
            post {
                always { sh 'docker logout || true' }
            }
        }

        stage('Deploy to k3s') {
            when { branch 'main' }
            steps {
                sh '''
                    export KUBECONFIG=${KUBECONFIG}
                    sed -i "s|:latest|:${BUILD_NUMBER}|g" infrastructure/k8s/manifests/*.yaml
                    kubectl apply -f infrastructure/k8s/manifests/ --namespace=${K8S_NAMESPACE}
                    kubectl rollout status deployment/auth-service  --namespace=${K8S_NAMESPACE} --timeout=120s
                    kubectl rollout status deployment/donor-service --namespace=${K8S_NAMESPACE} --timeout=120s
                    echo "Deployment complete."
                    kubectl get pods --namespace=${K8S_NAMESPACE}
                '''
            }
        }

        stage('Health Check') {
            when { branch 'main' }
            steps {
                sh '''
                    sleep 15
                    curl -sf https://bden.hinkaku.tech/health/ \
                      && echo "Health check: PASSED" \
                      || echo "Health check: FAILED — check logs"
                '''
            }
        }
    }

    post {
        success { echo "Pipeline succeeded. Build #${BUILD_NUMBER} deployed." }
        failure { echo "Pipeline FAILED at stage: ${env.STAGE_NAME}." }
        always {
            sh 'docker image prune -f || true'
            cleanWs()
        }
    }
}
```

---

## Section 12 — Docker Compose — Production Override

The VPS uses a production override file on top of the base `docker-compose.yml`. It removes live-reload volume mounts, uses pre-built images, and avoids exposing internal service/database ports publicly.

Save this as `/var/www/bden/docker-compose.prod.yml`:

```yaml
version: '3.9'

services:

  redis:
    restart: unless-stopped
    ports:
      - "6380:6379"   # host 6380 → container 6379

  auth-db:
    restart: unless-stopped
    ports:
      - "5440:5432"

  donor-db:
    restart: unless-stopped
    ports:
      - "5441:5432"

  request-db:
    restart: unless-stopped
    ports:
      - "5442:5432"

  campaign-db:
    restart: unless-stopped
    ports:
      - "5443:5432"

  notification-db:
    restart: unless-stopped
    ports:
      - "5444:5432"

  auth-service:
    image: your-dockerhub-username/bden-auth:latest
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8001 --workers 3
    restart: unless-stopped
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production

  donor-service:
    image: your-dockerhub-username/bden-donor:latest
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8002 --workers 3
    restart: unless-stopped
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production

  request-service:
    image: your-dockerhub-username/bden-request:latest
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8003 --workers 3
    restart: unless-stopped
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production

  campaign-service:
    image: your-dockerhub-username/bden-campaign:latest
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8004 --workers 2
    restart: unless-stopped
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production

  notification-service:
    image: your-dockerhub-username/bden-notification:latest
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8005 --workers 2
    restart: unless-stopped
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production

  celery-worker:
    image: your-dockerhub-username/bden-notification:latest
    command: celery -A config worker --loglevel=info --concurrency=2
    restart: unless-stopped
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production

  celery-beat:
    image: your-dockerhub-username/bden-notification:latest
    command: celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    restart: unless-stopped
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production

  nginx:
    restart: unless-stopped
    ports:
      - "127.0.0.1:18080:80"   # optional Compose smoke-test port only
```

### First-time startup on VPS

All commands below use both compose files together with `-f docker-compose.yml -f docker-compose.prod.yml`. You can create a shell alias to shorten this:

```bash
alias dc='docker compose -f /var/www/bden/docker-compose.yml -f /var/www/bden/docker-compose.prod.yml'
```

**Pull images (after first Jenkins push):**
```bash
cd /var/www/bden
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
```

**Start infrastructure first:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d redis auth-db donor-db request-db campaign-db notification-db

echo "Waiting 20 seconds for databases to initialize..."
sleep 20
```

**Run migrations for all services:**
```bash
for svc in auth-service donor-service request-service campaign-service notification-service; do
  docker compose -f docker-compose.yml -f docker-compose.prod.yml \
    run --rm $svc python manage.py migrate --noinput
done
```

**Seed initial data and create superuser:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  run --rm donor-service python manage.py seed_screening_centers

docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  run --rm auth-service python manage.py createsuperuser
```

**Start all services:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

✅ **CHECK:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
# Expected: every service shows State = Up (healthy)
```

---

## Section 13 — Prometheus and Grafana

### 13.1 — Create directories

```bash
sudo mkdir -p /opt/bden-monitoring/prometheus/data
sudo mkdir -p /opt/bden-monitoring/grafana/data
sudo chown -R bitnami:bitnami /opt/bden-monitoring
sudo chown -R 65534:65534 /opt/bden-monitoring/prometheus/data  # Prometheus user
sudo chown -R 472:472 /opt/bden-monitoring/grafana/data         # Grafana user
```

### 13.2 — Create Prometheus config

```bash
cat > /opt/bden-monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:8001']
    metrics_path: '/metrics/'

  - job_name: 'donor-service'
    static_configs:
      - targets: ['donor-service:8002']
    metrics_path: '/metrics/'

  - job_name: 'request-service'
    static_configs:
      - targets: ['request-service:8003']
    metrics_path: '/metrics/'

  - job_name: 'campaign-service'
    static_configs:
      - targets: ['campaign-service:8004']
    metrics_path: '/metrics/'

  - job_name: 'notification-service'
    static_configs:
      - targets: ['notification-service:8005']
    metrics_path: '/metrics/'
EOF
```

### 13.3 — Create monitoring stack

```bash
cat > /opt/bden-monitoring/docker-compose.yml << 'EOF'
version: '3.9'

networks:
  bden_default:
    external: true   # Connects to BDEN app network to scrape metrics

services:
  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: bden-prometheus
    restart: unless-stopped
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'
    networks:
      - bden_default

  grafana:
    image: grafana/grafana:10.4.2
    container_name: bden-grafana
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=change-this-immediately
      - GF_SERVER_ROOT_URL=https://grafana.bden.hinkaku.tech
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./grafana/data:/var/lib/grafana
    depends_on:
      - prometheus
EOF
```

### 13.4 — Start the monitoring stack

```bash
cd /opt/bden-monitoring
docker compose up -d
```

### 13.5 — Grafana initial setup

Open `https://grafana.bden.hinkaku.tech` and log in with `admin` / `change-this-immediately`. Change the password immediately when prompted.

**Add Prometheus data source:**
- Configuration → Data Sources → Add data source → Prometheus
- URL: `http://prometheus:9090`
- Save & Test → should show "Data source is working"

**Import dashboards** (Dashboard → Import → enter ID → Load):

| Dashboard ID | What it shows |
|---|---|
| `11074` | Django + Prometheus metrics |
| `763` | Redis metrics |
| `1860` | Node Exporter (server CPU/RAM/disk) |

---

## Section 14 — Ansible Playbooks

> 📝 **NOTE:** Run Ansible from your **local machine**, not the server. Install it with `pip install ansible`.

### Inventory file

Save to `infrastructure/ansible/inventory.ini`:

```ini
[bden_vps]
bden-production ansible_host=63.185.84.222 \
  ansible_user=bitnami \
  ansible_ssh_private_key_file=~/.ssh/your-lightsail-key.pem

[bden_vps:vars]
ansible_python_interpreter=/usr/bin/python3
```

### Playbook 1 — Install Docker

`infrastructure/ansible/playbooks/01_install_docker.yml`

```yaml
---
- name: Install Docker on BDEN VPS
  hosts: bden_vps
  become: true

  tasks:
    - name: Install Docker prerequisites
      apt:
        name: [apt-transport-https, ca-certificates, curl, gnupg]
        state: present
        update_cache: yes

    - name: Add Docker GPG key
      apt_key:
        url: https://download.docker.com/linux/ubuntu/gpg
        state: present

    - name: Add Docker repository
      apt_repository:
        repo: "deb [arch=amd64] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
        state: present

    - name: Install Docker Engine
      apt:
        name: [docker-ce, docker-ce-cli, containerd.io, docker-compose-plugin]
        state: present
        update_cache: yes

    - name: Add bitnami to docker group
      user:
        name: bitnami
        groups: docker
        append: yes

    - name: Enable and start Docker
      systemd:
        name: docker
        enabled: yes
        state: started
```

### Playbook 2 — Configure Nginx and UFW

`infrastructure/ansible/playbooks/02_configure_server.yml`

```yaml
---
- name: Configure Nginx and firewall for BDEN
  hosts: bden_vps
  become: true

  tasks:
    - name: Install Nginx and Certbot
      apt:
        name: [nginx, certbot, python3-certbot-nginx]
        state: present
        update_cache: yes

    - name: Copy BDEN Nginx config
      copy:
        src: ../files/bden_nginx.conf
        dest: /etc/nginx/sites-available/bden
        mode: '0644'
      notify: reload nginx

    - name: Enable BDEN site
      file:
        src: /etc/nginx/sites-available/bden
        dest: /etc/nginx/sites-enabled/bden
        state: link
      notify: reload nginx

    - name: Allow required ports via UFW
      ufw:
        rule: allow
        port: "{{ item.port }}"
        proto: tcp
        comment: "{{ item.name }}"
      loop:
        - { port: '22',   name: 'SSH' }
        - { port: '80',   name: 'HTTP' }
        - { port: '443',  name: 'HTTPS' }
        - { port: '8090', name: 'Jenkins' }
        - { port: '3002', name: 'Grafana' }

    - name: Enable UFW
      ufw:
        state: enabled
        default: deny

  handlers:
    - name: reload nginx
      systemd:
        name: nginx
        state: reloaded
```

### Playbook 3 — Deploy services

`infrastructure/ansible/playbooks/03_deploy_services.yml`

```yaml
---
- name: Deploy BDEN application services
  hosts: bden_vps
  become: false

  tasks:
    - name: Pull latest code
      git:
        repo: git@github-bden:AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git
        dest: /var/www/bden
        version: main
        key_file: ~/.ssh/bden_github
        accept_hostkey: yes
        force: yes

    - name: Pull latest Docker images
      command: >
        docker compose
        -f /var/www/bden/docker-compose.yml
        -f /var/www/bden/docker-compose.prod.yml
        pull
      args:
        chdir: /var/www/bden

    - name: Run migrations
      command: >
        docker compose
        -f /var/www/bden/docker-compose.yml
        -f /var/www/bden/docker-compose.prod.yml
        run --rm {{ item }} python manage.py migrate --noinput
      args:
        chdir: /var/www/bden
      loop:
        - auth-service
        - donor-service
        - request-service
        - campaign-service
        - notification-service

    - name: Start all services
      command: >
        docker compose
        -f /var/www/bden/docker-compose.yml
        -f /var/www/bden/docker-compose.prod.yml
        up -d
      args:
        chdir: /var/www/bden
```

**Run playbooks in order:**

```bash
cd infrastructure/ansible
ansible-galaxy collection install community.docker
ansible-playbook -i inventory.ini playbooks/01_install_docker.yml
ansible-playbook -i inventory.ini playbooks/02_configure_server.yml
ansible-playbook -i inventory.ini playbooks/03_deploy_services.yml
```

---

## Section 15 — Deploy Script

This script is called by Jenkins after a successful image push. It also works for manual emergency deploys.

Save to `/var/www/bden/scripts/deploy-prod.sh`:

```bash
#!/bin/bash
# BDEN Production Deploy Script
# Usage: bash deploy-prod.sh [BUILD_NUMBER]
set -e

BUILD_NUMBER=${1:-latest}
COMPOSE="-f /var/www/bden/docker-compose.yml -f /var/www/bden/docker-compose.prod.yml"

echo "=== BDEN Deploy: Build #${BUILD_NUMBER} — $(date) ==="
cd /var/www/bden

echo "--- Pulling new images..."
docker compose ${COMPOSE} pull

echo "--- Running migrations..."
docker compose ${COMPOSE} run --rm auth-service  python manage.py migrate --noinput
docker compose ${COMPOSE} run --rm donor-service python manage.py migrate --noinput

echo "--- Restarting services (rolling)..."
docker compose ${COMPOSE} up -d \
  --no-deps --force-recreate \
  auth-service donor-service request-service \
  campaign-service notification-service \
  celery-worker celery-beat nginx

echo "--- Verifying health..."
sleep 10
curl -sf http://localhost:30080/health/ \
  && echo "Health check: PASSED" \
  || echo "Health check: FAILED — check logs"

echo "=== Deploy complete: $(date) ==="
```

```bash
chmod +x /var/www/bden/scripts/deploy-prod.sh
```

---

## Section 16 — Pipeline Flow Summary

```
Developer pushes to main (or merges a PR)
│
├── GitHub sends webhook POST to:
│   https://jenkins.bden.hinkaku.tech/github-webhook/
│
└── Jenkins triggers BDEN-Pipeline
    │
    ├── 1. Checkout — pull the triggering commit
    ├── 2. Lint & Syntax — py_compile all .py files
    ├── 3. Test Auth — pytest (SQLite in-memory, no real DB needed)
    ├── 4. Test Donor — pytest
    ├── 5. Frontend Build — npm ci + vite build
    ├── 6. Build Images — parallel docker build (all 5 services)
    ├── 7. Push Images — docker push to Docker Hub  ← main only
    ├── 8. Deploy to k3s — kubectl apply + rollout   ← main only
    └── 9. Health Check — curl /health/              ← main only
```

**Production traffic flow:**

```
Browser → https://bden.hinkaku.tech (port 443)
  → Host Nginx terminates SSL
  → proxy_pass to K3s NodePort gateway (port 30080)
    → /api/auth/*        → auth-service:8001
    → /api/donors/*      → donor-service:8002
    → /api/requests/*    → request-service:8003
    → /api/campaigns/*   → campaign-service:8004
    → /api/notifications → notification-service:8005
```

**Event-driven emergency pipeline:**

```
request-service  → publishes EMERGENCY_REQUEST_CREATED to Redis
donor-service    → consumes event → runs Haversine matching
                 → publishes DONORS_MATCHED
notification-service → consumes → Celery tasks → sends emails
```

---

## Section 19 — Kubernetes Manifests

These files live in `infrastructure/k8s/manifests/` in the repository. Commit them and Jenkins applies them during the deploy stage.

### namespace.yaml

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bden-prod
---
apiVersion: v1
kind: Namespace
metadata:
  name: bden-monitoring
```

### auth-service.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: bden-prod
  labels:
    app: auth-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0    # Never drop below 2 running pods during update
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: your-dockerhub-username/bden-auth:latest
          ports:
            - containerPort: 8001
          env:
            - name: DJANGO_SETTINGS_MODULE
              value: config.settings.production
            - name: AUTH_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: bden-secrets
                  key: AUTH_SECRET_KEY
            - name: AUTH_DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: bden-secrets
                  key: AUTH_DB_PASSWORD
            - name: INTERNAL_API_KEY
              valueFrom:
                secretKeyRef:
                  name: bden-secrets
                  key: INTERNAL_API_KEY
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /health/
              port: 8001
            initialDelaySeconds: 15
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health/
              port: 8001
            initialDelaySeconds: 30
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: bden-prod
spec:
  selector:
    app: auth-service
  ports:
    - port: 8001
      targetPort: 8001
  type: ClusterIP
```

> 📝 The remaining services (`donor-service`, `request-service`, `campaign-service`, `notification-service`) follow the exact same pattern — copy the above, change the `app` label, `image`, port numbers, and secret key names accordingly. The `donor-service` also gets an HPA for autoscaling (see the full manifests in the repo).

### nginx-gateway.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-gateway-config
  namespace: bden-prod
data:
  default.conf: |
    upstream auth_service         { server auth-service:8001; }
    upstream donor_service        { server donor-service:8002; }
    upstream request_service      { server request-service:8003; }
    upstream campaign_service     { server campaign-service:8004; }
    upstream notification_service { server notification-service:8005; }

    server {
      listen 80;
      server_name _;

      location /api/auth/          { proxy_pass http://auth_service; }
      location /api/admin/         { proxy_pass http://auth_service; }
      location /api/donors/        { proxy_pass http://donor_service; }
      location /api/estimation/    { proxy_pass http://donor_service; }
      location /api/requests/      { proxy_pass http://request_service; }
      location /api/campaigns/     { proxy_pass http://campaign_service; }
      location /api/myths/         { proxy_pass http://campaign_service; }
      location /api/notifications/ { proxy_pass http://notification_service; }

      location /health/ {
        return 200 '{"status":"ok","gateway":"bden-nginx"}';
        add_header Content-Type application/json;
      }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-gateway
  namespace: bden-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx-gateway
  template:
    metadata:
      labels:
        app: nginx-gateway
    spec:
      containers:
        - name: nginx
          image: nginx:1.25-alpine
          ports:
            - containerPort: 80
          volumeMounts:
            - name: nginx-config
              mountPath: /etc/nginx/conf.d
      volumes:
        - name: nginx-config
          configMap:
            name: nginx-gateway-config
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-gateway
  namespace: bden-prod
spec:
  selector:
    app: nginx-gateway
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080
  type: NodePort
```

> ⚠️ Host Nginx should proxy to `http://127.0.0.1:30080` for the K3s gateway. Docker Compose's `18080` port is only for optional smoke tests.

### Apply all manifests

```bash
kubectl apply -f /var/www/bden/infrastructure/k8s/manifests/

# Watch pods come up
kubectl get pods -n bden-prod --watch
```

---

## Section 20 — Team Workflow

### Branch strategy

| Branch | Purpose | Deploys to |
|--------|---------|-----------|
| `main` | Production — stable only | ✅ Production (auto via Jenkins) |
| `develop` | Integration — feature branches merge here | ❌ No auto-deploy |
| `feature/*` | Individual feature work | ❌ No auto-deploy |
| `hotfix/*` | Urgent production fixes — branch from `main` | ✅ Production (via PR to main) |

### Day-to-day development

```bash
# Start of day — pull latest from develop
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/my-feature

# Work locally, commit often
git add .
git commit -m "feat(donor): add blood type toggle endpoint with validation"
# Format: type(scope): description
# Types: feat, fix, test, docs, refactor, chore

# Push and open a PR against develop (not main)
git push origin feature/my-feature
```

Open **New Pull Request → base: `develop`** on GitHub. Request review from your teammate on Discord.

After review and merge to `develop`, Jenkins runs tests — verify the build is green.

When a sprint is complete and `develop` is stable, open a PR from `develop → main`. Both team members review. Merge → Jenkins auto-deploys.

### Scrum artifacts to maintain

**Daily standup** (async, in Discord `#daily-standup`):
```
Yesterday: what I worked on
Today: what I'm working on
Blockers: anything blocking me
```
Format your message this way — it's easy to screenshot for the report.

**Burndown chart:** maintain in Google Sheets, one row per day. Columns: `Date | Story Points Remaining | Ideal Burndown`. Screenshot at end of each sprint.

**Sprint retrospective:** write a summary in Google Doc Chapter 3 after each sprint.

---

## Section 21 — Documentation Screenshots

Take these as you go — recreating them from memory is painful.

### Infrastructure
- [ ] AWS Lightsail console showing instance (name, IP, status)
- [ ] Lightsail Networking tab with firewall rules
- [ ] DNS records in registrar showing `bden.*` entries
- [ ] `kubectl get nodes` (shows k3s `Ready`)
- [ ] `kubectl get pods -n bden-prod` (all `Running`)
- [ ] `docker ps` on VPS (all containers up)
- [ ] `sudo ufw status verbose`

### Jenkins
- [ ] Jenkins dashboard showing `BDEN-Pipeline` job
- [ ] A **successful** pipeline run with all stages green
- [ ] A **failed** pipeline run (useful for comparison in report)
- [ ] Jenkins Credentials page *(mask/blur actual values)*
- [ ] GitHub webhook page showing green tick

### Nginx and SSL
- [ ] Browser padlock on `https://bden.hinkaku.tech`
- [ ] Browser padlock on `https://jenkins.bden.hinkaku.tech`
- [ ] Browser padlock on `https://grafana.bden.hinkaku.tech`
- [ ] `sudo /opt/bitnami/apache/bin/apachectl -t` or `sudo nginx -t` showing syntax ok
- [ ] `ls /etc/nginx/sites-enabled/` or Bitnami server block directory showing `bden`

### Application
- [ ] Swagger UI at `https://bden.hinkaku.tech/api/docs/`
- [ ] Django admin panel (unfold theme)
- [ ] Successful donor registration — Postman/curl showing `201`
- [ ] Successful login response with JWT tokens *(blur the token values)*
- [ ] Hospital registration → pending status response
- [ ] Admin approval — before and after status

### Monitoring
- [ ] Grafana dashboard showing live BDEN metrics
- [ ] Prometheus targets page showing all services `UP`
- [ ] At least one alert rule configured
- [ ] Docker Hub repo showing images with build number tags

---

## Section 22 — Maintenance and Ongoing Operations

### Update a single service without full pipeline

```bash
cd /var/www/bden
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  build auth-service
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --no-deps auth-service
# --no-deps means only auth-service restarts, not its dependencies
```

### Rolling restart in k3s (zero downtime)

```bash
kubectl rollout restart deployment/auth-service -n bden-prod
kubectl rollout status deployment/auth-service -n bden-prod --timeout=60s
```

### View live logs

```bash
# Docker Compose mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  logs -f auth-service --tail=100

# k3s mode
kubectl logs -l app=auth-service -n bden-prod --tail=100 -f
```

### Django shell on production

```bash
# Docker Compose mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec auth-service python manage.py shell

# k3s mode
kubectl exec -it deployment/auth-service -n bden-prod \
  -- python manage.py shell
```

### Backup all databases

```bash
sudo mkdir -p /var/backups/bden
DATE=$(date +%Y%m%d_%H%M%S)

for db in auth donor request campaign notification; do
  docker compose -f docker-compose.yml -f docker-compose.prod.yml \
    exec ${db}-db pg_dump -U bden_user bden_${db} \
    > /var/backups/bden/${db}_${DATE}.sql
  echo "Backed up: ${db}"
done

ls -lh /var/backups/bden/
```

### Weekly disk space cleanup

```bash
df -h /
docker system df
docker system prune -f
docker image prune -a --filter "until=72h" -f
# Removes images older than 72h — safe if Jenkins tags by build number
```

### Check SSL Certificate Expiry

```bash
# Bitnami bncert-tool path
sudo /opt/bitnami/letsencrypt/certbot certificates 2>/dev/null || sudo certbot certificates

# Dry-run renewal before relying on automatic renewal:
sudo /opt/bitnami/letsencrypt/certbot renew --dry-run 2>/dev/null || sudo certbot renew --dry-run
```

---

## Section 23 — Quick Reference Card

### URLs

| URL | Purpose |
|-----|---------|
| `https://bden.hinkaku.tech/api/docs/` | Swagger UI |
| `https://bden.hinkaku.tech/admin/` | Django admin |
| `https://jenkins.bden.hinkaku.tech` | Jenkins CI/CD |
| `https://grafana.bden.hinkaku.tech` | Monitoring |

### Most-used commands

```bash
# SSH to server
ssh -i /path/to/key.pem bitnami@63.185.84.222

# Start all services
cd /var/www/bden
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# View all container statuses
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs (replace auth-service with any service name)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f auth-service

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  run --rm auth-service python manage.py migrate

# Manual deploy (skipping Jenkins)
bash /var/www/bden/scripts/deploy-prod.sh

# Restart Jenkins
sudo systemctl restart jenkins

# Reload Bitnami Apache safely
sudo /opt/bitnami/apache/bin/apachectl -t && sudo /opt/bitnami/ctlscript.sh restart apache

# If using system Nginx instead:
sudo nginx -t && sudo systemctl reload nginx

# Check k3s pods
kubectl get pods -n bden-prod

# Force redeploy a service in k3s
kubectl rollout restart deployment/auth-service -n bden-prod

# Check disk space
df -h / && docker system df
```

---

## Final Verification Checklist

Work through this together before calling the VPS "production ready".

### Infrastructure
- [ ] SSH access works: `ssh -i key.pem bitnami@63.185.84.222`
- [ ] `/var/www/bden` exists and contains the repo
- [ ] `docker --version` works without `sudo`
- [ ] `kubectl get nodes` shows `Ready`
- [ ] `kubectl get namespaces` shows `bden-prod` and `bden-monitoring`
- [ ] `kubectl get secrets -n bden-prod` shows `bden-secrets`

### Networking
- [ ] `sudo ufw status` shows all required ports
- [ ] Lightsail console firewall matches UFW rules
- [ ] BDEN internal ports (8001–8005, 5440–5444, 6380) are NOT externally reachable

### DNS and SSL
- [ ] `dig bden.hinkaku.tech +short` → `63.185.84.222`
- [ ] `dig jenkins.bden.hinkaku.tech +short` → `63.185.84.222`
- [ ] `dig grafana.bden.hinkaku.tech +short` → `63.185.84.222`
- [ ] `curl -I https://bden.hinkaku.tech` → no SSL error
- [ ] `sudo /opt/bitnami/letsencrypt/certbot certificates` or `sudo certbot certificates` → `bden.hinkaku.tech` is valid

### Nginx
- [ ] Apache or Nginx config test returns syntax ok
- [ ] `ls /etc/nginx/sites-enabled/` or Bitnami server block directory shows `bden`
- [ ] Apache and Nginx are not both competing for public `80`/`443`

### Jenkins
- [ ] `https://jenkins.bden.hinkaku.tech` loads login page
- [ ] `BDEN-Pipeline` job exists
- [ ] `dockerhub-credentials` credential created
- [ ] `github-credentials` credential created (if private repo)
- [ ] `kubeconfig` credential created
- [ ] GitHub webhook shows green tick in GitHub → Settings → Webhooks
- [ ] **Build Now** → pipeline runs without errors
- [ ] Push a commit to `main` → Jenkins auto-triggers within 30 seconds

### Application
- [ ] `docker compose ps` → all containers `Up`
- [ ] All migrations ran without errors
- [ ] `curl http://localhost:30080/health/` → `{"status": "ok", ...}`
- [ ] `https://bden.hinkaku.tech/api/docs/` → Swagger UI loads
- [ ] `https://bden.hinkaku.tech/admin/` → admin panel loads

### Monitoring
- [ ] `https://grafana.bden.hinkaku.tech` → Grafana login loads
- [ ] Prometheus data source shows "Data source is working"
- [ ] At least one dashboard shows live metrics from BDEN services

### End-to-end CI/CD test
- [ ] Make a trivial change, push to a feature branch, open a PR, merge to `main`
- [ ] Jenkins triggers automatically within 30 seconds
- [ ] All pipeline stages pass (green)
- [ ] New Docker images appear on Docker Hub with new build number
- [ ] `kubectl get pods -n bden-prod` shows freshly restarted pods (low `AGE`)
- [ ] `https://bden.hinkaku.tech/health/` still returns 200

---

## Troubleshooting

### Jenkins not triggering on push

```bash
# Verify webhook is reaching Jenkins
curl -I https://jenkins.bden.hinkaku.tech/github-webhook/
# Should return 200 or 302, not 5xx

# Check Jenkins system log
# Jenkins → Manage Jenkins → System Log → look for webhook receipt
```

### Container exits immediately after starting

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs auth-service
# Look for: missing SECRET_KEY, DB connection refused, missing .env values
```

### Database connection refused

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec auth-db psql -U bden_user -d bden_auth -c "SELECT 1"
# If this fails: check AUTH_DB_PASSWORD in .env matches the container env
```

### Nginx 502 Bad Gateway

```bash
# Check the relevant container is running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Check Nginx is proxying to the correct port
sudo nginx -T | grep proxy_pass
```

### Nginx test fails because certificate files are missing

```bash
sudo nginx -t
```

If the error mentions `/etc/letsencrypt/live/.../fullchain.pem`, `/opt/bitnami/.../server.crt`, or `privkey.pem`, your web server config is using HTTPS before certificates exist.

Fix:

1. Replace the BDEN Nginx file with the HTTP-only config from Section 7.
2. Run `sudo nginx -t`.
3. Reload Nginx.
4. Make sure DNS points to `63.185.84.222`.
5. Run the `bncert-tool` command from Section 8, or Certbot only if you intentionally chose the system Nginx path.

> ⚠️ Always use `reload` when possible. Reload is zero-downtime. Restart drops active connections briefly.

### kubectl not working in Jenkins pipeline

```bash
sudo ls -la /var/lib/jenkins/.kube/config
sudo -u jenkins kubectl get nodes
# If permission denied: re-run the chown from Section 9.4
```

### Disk space filling up

```bash
docker system df
docker image prune -a --filter "until=48h" -f
du -sh /var/lib/jenkins/
# If Jenkins is huge: Dashboard → BDEN-Pipeline → Configure → discard old builds
```

### Port conflict with Apache or another service

```bash
sudo ss -tlnp | grep <port-number>
# If a BDEN port conflicts:
# 1. Edit docker-compose.prod.yml to change the host port
# 2. Restart only the affected container:
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --no-deps <service-name>
```
