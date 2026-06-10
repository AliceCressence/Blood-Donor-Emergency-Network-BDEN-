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
  → Run checks/tests → Build frontend → Build Docker images on VPS
  → Push images to local VPS registry
  → Deploy Kubernetes/k3s production stack
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
13. [Docker Compose — Production Stack](#section-12--docker-compose--production-stack)
14. [Prometheus and Grafana](#section-13--prometheus-and-grafana)
15. [Ansible Playbooks](#section-14--ansible-playbooks)
16. [Deploy Script](#section-15--deploy-script)
17. [Pipeline Flow Summary](#section-16--pipeline-flow-summary)
18. [Full-System Infrastructure Setup](#section-19--full-system-infrastructure-setup)
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
| Prometheus | — | 9093 |
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

Jenkins creates the production Kubernetes secret automatically from `/var/www/bden/.env.prod`. If you need to create it manually, use the same file.

```bash
kubectl create secret generic bden-env \
  --namespace=bden-prod \
  --from-env-file=/var/www/bden/.env.prod \
  --dry-run=client -o yaml | kubectl apply -f -
```

✅ **CHECK:**
```bash
kubectl get secrets -n bden-prod
# Expected: bden-env   Opaque   ...
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

`502` is acceptable before the BDEN frontend, gateway, Jenkins, or Grafana are running. It means TLS worked and the reverse proxy reached the upstream phase.

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

**Credential 1 — Docker Hub** *(optional, future image registry path)*

The current production pipeline builds images locally on the VPS and does not require Docker Hub. Add this credential only if you later change Jenkins to push/pull versioned images from a registry.

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

The repository now contains a production-aware `Jenkinsfile` that deploys BDEN to k3s when the Kubernetes runtime is healthy. Docker Compose is still used to build images and is also kept as the emergency production fallback. This is intentional: if k3s has a CNI/pod-network issue, Jenkins can still bring `bden.hinkaku.tech` online through `docker-compose.prod.yml` while Kubernetes is repaired.

### 11.1 — Current production deployment behavior

The deploy stage follows this order:

1. Build all production images with `docker-compose.prod.yml`.
2. Push images to the local VPS registry at `localhost:5000`.
3. Apply the Kubernetes namespace, network policy, secrets, databases, Redis, services, event consumers, frontend, and gateway.
4. Run a Kubernetes pod-to-pod network preflight from a temporary `bden-network-check` pod.
5. If Kubernetes pod networking works, deploy through k3s and point host Nginx to the Kubernetes gateway on `127.0.0.1:30080`.
6. If Kubernetes pod networking fails, start the production Compose stack and point host Nginx to:
   - frontend: `127.0.0.1:8088`
   - gateway/API: `127.0.0.1:8080`

> ⚠️ **WARNING:** A successful Docker image build does not automatically make the app available at `bden.hinkaku.tech`. The site becomes available only after either the Kubernetes deployment succeeds or the Compose fallback starts and host Nginx points to the correct runtime.

### 11.2 — What the fast Kubernetes failure means

If Jenkins logs show something like:

```text
ERROR: Kubernetes pod network cannot reach 10.42.x.x:5432
```

that means the application images were built, but the k3s pod network is broken. In that state, app pods cannot reach database pods even by direct pod IP. This is a k3s/CNI problem, not a Django, PostgreSQL, or DNS-only problem.

The Jenkinsfile now handles this by falling back to production Compose instead of failing the whole deploy. Kubernetes should still be repaired later, but it should not block the public site from coming online.

### 11.3 — Jenkins sudo requirements

For the automatic Nginx switch to work, Jenkins needs passwordless sudo for these safe commands:

```bash
sudo visudo -f /etc/sudoers.d/jenkins-bden
```

Add:

```text
jenkins ALL=(root) NOPASSWD: /bin/cp, /bin/ln, /usr/sbin/nginx, /bin/systemctl, /usr/bin/systemctl, /bin/mkdir
```

✅ **CHECK:**

```bash
sudo -u jenkins sudo -n nginx -t
sudo -u jenkins sudo -n systemctl reload nginx
```

If Jenkins cannot use sudo, the pipeline can still start the Compose containers, but you must manually copy the correct Nginx host config and reload Nginx.

### 11.1 — What the current Jenkinsfile does

The pipeline has two separate paths:

| Path | Runs on | Uses | Env file | Purpose |
|------|---------|------|----------|---------|
| CI | branches and PRs | `docker-compose.yml` | `.env.example` | checks, tests, frontend build |
| Production | `main` only | `docker-compose.prod.yml` + `infrastructure/k8s/` | `.env.prod` | build images and deploy to k3s |

Pipeline stages in order:

| # | Stage | What it does |
|---|-------|--------------|
| 1 | Checkout | Checks out the GitHub repo and prints branch/remote info |
| 2 | Compose Validation | Validates local and production Compose configs |
| 3 | Backend Syntax Checks | Runs `python3 -m compileall` on all Django services |
| 4 | Django Checks | Runs `python manage.py check` for all services |
| 5 | Django Tests | Runs `pytest` for auth, donor, request, campaign, and notification services |
| 6 | Frontend Build | Builds the production frontend image and runs `npm run build` inside the Docker build |
| 7 | Build Production Images | Builds prod images on `main` and PRs targeting `main` |
| 8 | Deploy Production to Kubernetes | Runs only on `main` when `DEPLOY_PROD=true` |

The deploy stage:

1. verifies `.env.prod` exists;
2. validates `docker-compose.prod.yml` with `.env.prod`;
3. builds production images;
4. starts/uses the local registry at `127.0.0.1:5000`;
5. tags and pushes BDEN images to `localhost:5000/bden/*`;
6. creates/updates the Kubernetes secret `bden-env` from `.env.prod`;
7. applies `infrastructure/k8s/*.yaml`;
8. waits for StatefulSets and Deployments to roll out;
9. checks every service through the k3s gateway NodePort `30080`.

The Jenkins cleanup step only stops the CI Compose project, `bden-ci`. It does **not** stop Kubernetes production resources.

### 11.2 — Required Jenkins job parameter

Create or confirm this Jenkins build parameter:

| Name | Type | Default | Meaning |
|------|------|---------|---------|
| `DEPLOY_PROD` | Boolean | `true` | Allows deployment when the build runs on `main` |

For local Jenkins experiments, set `DEPLOY_PROD=false` unless you deliberately want to deploy to the VPS k3s cluster.

### 11.3 — Required `.env.prod` file

Jenkins needs a real `.env.prod` file in the job workspace before production deploy can run.

Recommended server storage:

```bash
sudo mkdir -p /var/www/bden
sudo cp /var/www/bden/.env.prod.example /var/www/bden/.env.prod
sudo nano /var/www/bden/.env.prod
sudo chown jenkins:jenkins /var/www/bden/.env.prod
sudo chmod 600 /var/www/bden/.env.prod
```

Then link it into the Jenkins workspace after the first checkout:

```bash
cd /var/lib/jenkins/workspace/BDEN-Pipeline
ln -sf /var/www/bden/.env.prod .env.prod
```

> Keep `.env.prod` on the VPS only. Do not commit it.

### 11.4 — Validate the Jenkinsfile manually

From `/var/www/bden` or the Jenkins workspace:

```bash
docker compose --env-file .env.example config --quiet
docker compose --env-file .env.example -f docker-compose.prod.yml config --quiet
```

Expected behavior: no output and exit code `0`.

### 11.5 — Jenkins and Docker permissions

Native Jenkins must be able to run Docker and kubectl:

```bash
sudo usermod -aG docker jenkins
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

Verify as the Jenkins user:

```bash
sudo -u jenkins docker ps
sudo -u jenkins kubectl get nodes
```

Expected behavior: Docker lists containers or an empty table without permission errors, and kubectl shows the k3s node as `Ready`.

### 11.6 — Local registry for k3s image pulls

Jenkins builds images locally on the VPS. k3s must then be able to pull those images. The pipeline starts a local registry container on `127.0.0.1:5000` and pushes images to:

```text
localhost:5000/bden/frontend:latest
localhost:5000/bden/auth-service:latest
localhost:5000/bden/donor-service:latest
localhost:5000/bden/request-service:latest
localhost:5000/bden/campaign-service:latest
localhost:5000/bden/notification-service:latest
```

If Jenkins has passwordless sudo, it will also configure `/etc/rancher/k3s/registries.yaml` automatically. If not, run this once on the VPS:

```bash
sudo mkdir -p /etc/rancher/k3s
sudo tee /etc/rancher/k3s/registries.yaml >/dev/null <<'EOF'
mirrors:
  "localhost:5000":
    endpoint:
      - "http://127.0.0.1:5000"
EOF

sudo systemctl restart k3s
kubectl wait --for=condition=Ready node --all --timeout=180s
```

Optional, but useful if you want Jenkins to update host Nginx, write the k3s local registry config, and restart k3s automatically when cluster DNS gets stuck:

```bash
sudo visudo
```

Add:

```text
jenkins ALL=(root) NOPASSWD: /bin/cp, /usr/bin/cp, /bin/ln, /usr/bin/ln, /usr/sbin/nginx, /bin/systemctl, /usr/bin/systemctl, /bin/mkdir, /usr/bin/mkdir, /bin/grep, /usr/bin/grep, /usr/bin/tee
```

Do not test this with `sudo -n true`; the pipeline uses command-specific sudo. Test the actual commands Jenkins needs:

```bash
sudo -u jenkins sudo -n /usr/bin/systemctl status k3s >/dev/null && echo "jenkins can access systemctl"
sudo -u jenkins sudo -n /usr/bin/mkdir -p /etc/rancher/k3s && echo "jenkins can create k3s config dir"
sudo -u jenkins sudo -n /usr/sbin/nginx -t && echo "jenkins can test nginx"
```

---

## Section 12 — Production Build, Kubernetes Runtime, and Compose Fallback

The production pipeline now uses two pieces together:

- `docker-compose.prod.yml` builds production images locally on the VPS.
- `infrastructure/k8s/*.yaml` runs the actual production stack in k3s.

### Frontend-to-backend routing

In production, the frontend should call the backend through the same public origin:

```text
https://bden.hinkaku.tech/api/...
```

Do not expose service ports `8001` through `8005` publicly. Host Nginx routes `/api/`, `/health/`, and `/django-admin/` to the internal gateway, and routes every other path to the frontend.

The frontend API client also guards against accidental production builds with `VITE_API_BASE_URL=http://localhost:8000`. If the app is opened on a real domain and the configured API URL is localhost, it falls back to `window.location.origin`, so auth calls still go to `https://bden.hinkaku.tech/api/auth/...`.

✅ **CHECK in the browser devtools Network tab:**

```text
POST https://bden.hinkaku.tech/api/auth/login/
```

If you see `localhost:8000` in production browser requests, rebuild and redeploy the frontend.

Docker Compose remains useful as a fallback, but Kubernetes is now the target production runtime. On this VPS, keep both paths ready:

- **Normal path:** k3s serves the stack through the Kubernetes gateway NodePort `30080`.
- **Fallback path:** `docker-compose.prod.yml` serves the stack directly on localhost ports, and host Nginx proxies the public domain to those ports.

This dual path is important because k3s can be healthy enough to show pods as `Running` while still having a broken CNI/pod network. When that happens, app containers cannot reach database containers inside Kubernetes. Compose bypasses that specific k3s network layer.

### 12.1 — Manual Compose fallback

Run this only when Kubernetes is failing and you need `bden.hinkaku.tech` online quickly:

```bash
cd /var/www/bden

docker compose \
  --env-file .env.prod \
  -f docker-compose.prod.yml \
  -p bden-prod \
  up -d --remove-orphans
```

BDEN's Compose fallback uses these localhost-only ports:

| Runtime piece | Host port |
|---------------|-----------|
| frontend | `8088` |
| gateway/API | `8080` |
| auth-db | `25432` |
| donor-db | `25433` |
| request-db | `25434` |
| campaign-db | `25435` |
| notification-db | `25436` |
| Redis | `26379` |

If your `/var/www/bden/.env.prod` still contains older values such as `15432`, `15433`, or `16379`, replace them with the values above. Those older ports may collide with local development stacks, stale containers, or another project on the VPS.

✅ **CHECK:**

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod ps
curl -fsS http://127.0.0.1:8088/health/
curl -fsS http://127.0.0.1:8080/health/
curl -fsS http://127.0.0.1:8080/health/auth/
curl -fsS http://127.0.0.1:8080/health/donor/
curl -fsS http://127.0.0.1:8080/health/request/
curl -fsS http://127.0.0.1:8080/health/campaign/
curl -fsS http://127.0.0.1:8080/health/notification/
```

Then point host Nginx to the Compose fallback:

```bash
sudo cp infrastructure/nginx/bden.host.compose.conf /etc/nginx/sites-available/bden
sudo ln -sf /etc/nginx/sites-available/bden /etc/nginx/sites-enabled/bden
sudo nginx -t
sudo systemctl reload nginx
```

✅ **CHECK from your laptop:**

```bash
curl -I http://bden.hinkaku.tech
```

Expected behavior: the response is no longer `502 Bad Gateway`. If SSL is already configured, test `https://bden.hinkaku.tech` as well.

> 📝 **NOTE:** The repository host Nginx files are HTTP templates. If Certbot previously added HTTPS blocks to `/etc/nginx/sites-available/bden`, copying this file will replace that generated HTTPS config. After the HTTP route works, rerun `sudo certbot --nginx -d bden.hinkaku.tech -d jenkins.bden.hinkaku.tech -d grafana.bden.hinkaku.tech` or restore your server-side SSL-enabled Nginx file.

### 12.2 — Switching back to Kubernetes

After k3s networking is repaired and the Jenkins Kubernetes deploy passes, Jenkins will copy `infrastructure/nginx/bden.host.k8s.conf` and route `bden.hinkaku.tech` back to `127.0.0.1:30080`.

Manual switch:

```bash
cd /var/www/bden
sudo cp infrastructure/nginx/bden.host.k8s.conf /etc/nginx/sites-available/bden
sudo ln -sf /etc/nginx/sites-available/bden /etc/nginx/sites-enabled/bden
sudo nginx -t
sudo systemctl reload nginx
```

✅ **CHECK:**

```bash
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/
curl -I http://bden.hinkaku.tech
```

### 12.3 — Repairing k3s pod networking

If the Jenkins preflight says a pod cannot reach another pod IP, first try a simple restart:

```bash
sudo systemctl restart k3s
kubectl wait --for=condition=Ready node --all --timeout=180s
kubectl get pods -A -o wide
```

Then rerun the Jenkins deployment.

If it still fails, do not keep patching Django services. The CNI layer is broken. Once the Compose fallback is online and the `.env.prod` file is safe, schedule a clean k3s reset:

```bash
sudo /usr/local/bin/k3s-uninstall.sh
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown "$USER:$USER" ~/.kube/config
kubectl get nodes
```

> ⚠️ **WARNING:** Do not uninstall k3s while relying on Kubernetes for the live site. Put the site on Compose fallback first.

### 12.1 — Production ports

The active k3s deployment exposes BDEN through one NodePort:

| Host address | Purpose |
|--------------|---------|
| `127.0.0.1:30080` | BDEN Kubernetes gateway |
| `127.0.0.1:5000` | local registry used by Jenkins and k3s |

Host Nginx remains the public entry point on ports `80` and `443`.

Recommended host Nginx routing:

```text
/ -> http://127.0.0.1:30080
```

### 12.2 — Production files now expected in the repo

These files should exist after pulling the latest `main`:

```text
Jenkinsfile
docker-compose.prod.yml
.env.prod.example
infrastructure/k8s/namespace.yaml
infrastructure/k8s/network-policy.yaml
infrastructure/k8s/data-services.yaml
infrastructure/k8s/app-services.yaml
infrastructure/k8s/event-consumers.yaml
infrastructure/k8s/frontend-gateway.yaml
infrastructure/nginx/bden.host.k8s.conf
frontend/Dockerfile
frontend/nginx.conf
frontend/.dockerignore
```

Check:

```bash
cd /var/www/bden
git pull origin main
ls Jenkinsfile docker-compose.prod.yml .env.prod.example infrastructure/k8s/frontend-gateway.yaml infrastructure/nginx/bden.host.k8s.conf
```

### 12.3 — Create the production environment file

Copy the template:

```bash
cd /var/www/bden
cp .env.prod.example .env.prod
nano .env.prod
chmod 600 .env.prod
```

At minimum, replace:

- all `change-me-*` secret keys;
- all database passwords;
- `ALLOWED_HOSTS`;
- `FRONTEND_URL`;
- `VITE_API_BASE_URL`;
- Google OAuth values if Google login is enabled.

For the current domain/IP situation, keep both the domain and raw IP where useful:

```env
ALLOWED_HOSTS=bden.hinkaku.tech,3.77.183.190,localhost,127.0.0.1,host.docker.internal,auth-service,donor-service,request-service,campaign-service,notification-service
FRONTEND_URL=https://bden.hinkaku.tech
VITE_API_BASE_URL=https://bden.hinkaku.tech
GOOGLE_REDIRECT_URI=https://bden.hinkaku.tech/auth/google/callback
GOOGLE_AUTH_FRONTEND_CALLBACK_URL=https://bden.hinkaku.tech/auth/google/callback
```

Google OAuth authorized redirect URIs should include:

```text
https://bden.hinkaku.tech/auth/google/callback
http://3.77.183.190/auth/google/callback
```

Use the raw IP callback only while testing without the domain/SSL path.

### 12.4 — Validate production Compose

```bash
cd /var/www/bden
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod config --quiet
```

Expected behavior: no output and exit code `0`.

### 12.5 — Build production images manually

```bash
cd /var/www/bden
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod build
```

This is the same image build step Jenkins performs before pushing images to `localhost:5000`.

### 12.6 — Apply Kubernetes manually

```bash
cd /var/www/bden

docker run -d \
  --restart unless-stopped \
  --name bden-local-registry \
  -p 127.0.0.1:5000:5000 \
  registry:2 2>/dev/null || docker start bden-local-registry

docker tag bden-prod-frontend:latest localhost:5000/bden/frontend:latest
docker tag bden-prod-auth-service:latest localhost:5000/bden/auth-service:latest
docker tag bden-prod-donor-service:latest localhost:5000/bden/donor-service:latest
docker tag bden-prod-request-service:latest localhost:5000/bden/request-service:latest
docker tag bden-prod-campaign-service:latest localhost:5000/bden/campaign-service:latest
docker tag bden-prod-notification-service:latest localhost:5000/bden/notification-service:latest

docker push localhost:5000/bden/frontend:latest
docker push localhost:5000/bden/auth-service:latest
docker push localhost:5000/bden/donor-service:latest
docker push localhost:5000/bden/request-service:latest
docker push localhost:5000/bden/campaign-service:latest
docker push localhost:5000/bden/notification-service:latest

kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/network-policy.yaml
kubectl create secret generic bden-env \
  --namespace=bden-prod \
  --from-env-file=/var/www/bden/.env.prod \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f infrastructure/k8s/
```

Jenkins does these steps automatically on `main`.

### 12.7 — Health checks

```bash
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/auth/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/donor/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/request/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/campaign/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/notification/
```

Expected behavior: every command returns JSON with service status.

### 12.8 — Useful Kubernetes commands

```bash
kubectl get pods -n bden-prod -o wide
kubectl get svc -n bden-prod
kubectl logs -n bden-prod deployment/auth-service --tail=100
kubectl rollout restart deployment/auth-service -n bden-prod
kubectl rollout status deployment/auth-service -n bden-prod --timeout=180s
```

---
## Section 13 — Prometheus and Grafana

BDEN now keeps the monitoring runtime files in `infrastructure/prometheus/`:

- `docker-compose.yml`
- `prometheus.yml`
- Grafana datasource provisioning
- Grafana dashboard provisioning

When BDEN is running through the Compose fallback, the Django services use host networking. Prometheus itself runs in a container, so it must scrape the services through `host.docker.internal`, not through Docker service names such as `auth-service` or `donor-service`.

On this shared VPS, Docker bridge/container-to-container networking may be affected by k3s/CNI/iptables state. Grafana should therefore query Prometheus through the host gateway too:

```text
http://host.docker.internal:9093
```

The monitoring compose file adds `host.docker.internal:host-gateway` to both Prometheus and Grafana for that reason.

The Prometheus scrape targets are:

| Service | Target |
|---------|--------|
| auth-service | `host.docker.internal:18001/metrics/` |
| donor-service | `host.docker.internal:18002/metrics/` |
| request-service | `host.docker.internal:18003/metrics/` |
| campaign-service | `host.docker.internal:18004/metrics/` |
| notification-service | `host.docker.internal:18005/metrics/` |

If Grafana dashboards show `No data` or `N/A`, first check Prometheus targets:

```bash
curl -fsS http://127.0.0.1:9093/-/healthy
curl -fsS "http://127.0.0.1:9093/api/v1/targets" | python3 -m json.tool
```

All `bden-*` targets should be `up`. If they are down, restart monitoring from the repo:

```bash
cd /var/www/bden/infrastructure/prometheus
docker compose up -d --remove-orphans
```

Or with Ansible:

```bash
cd infrastructure/ansible
ansible-playbook playbooks/deploy-monitoring.yml
```

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
      - "127.0.0.1:9093:9090"
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

> 📝 **NOTE:** Ansible is optional for the current milestone. Use it after the manual/Jenkins path is working, so you automate a setup that has already been proven on the VPS.
>
> Short answer to your question: yes, you can do Ansible later. For the firewall, you can also finish it later while testing privately, but do not treat the server as production-ready or expose users to it until both Lightsail firewall and UFW are configured. At minimum, keep `22`, `80`, `443`, `8090`, and `3002` intentional, and keep BDEN internal ports closed publicly.

### 14.1 — When to use Ansible

Use Ansible for repeatable infrastructure once these are already working manually:

- Docker and Docker Compose are installed.
- `/var/www/bden` contains the repository.
- `/var/www/bden/.env.prod` exists and is secure.
- Jenkins can deploy with `docker-compose.prod.yml`.
- Host Nginx routes BDEN traffic to the k3s gateway NodePort `30080`.
- Health checks pass for frontend and all five backend services.

Do not make Ansible the first deployment method. First make the server work, then automate the working recipe.

### 14.2 — Inventory file

Save to `infrastructure/ansible/inventory.ini`:

```ini
[bden_vps]
bden-production ansible_host=63.185.84.222 \
  ansible_user=bitnami \
  ansible_ssh_private_key_file=~/.ssh/your-lightsail-key.pem

[bden_vps:vars]
ansible_python_interpreter=/usr/bin/python3
```

### 14.3 — Playbook 1: Install Docker

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

### 14.4 — Playbook 2: Configure Nginx and UFW

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

The `../files/bden_nginx.conf` file should match the current host Nginx shape:

```nginx
server {
    listen 80;
    server_name bden.hinkaku.tech 3.77.183.190;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:30080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> ⚠️ If you already use HTTPS in `/etc/nginx/sites-available/bden`, do not let Ansible overwrite it with an HTTP-only file unless you intend to re-run Certbot afterward. For a mature playbook, template both HTTP and HTTPS versions.

### 14.5 — Playbook 3: Deploy the full k3s stack

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

    - name: Validate production Compose file
      command: >
        docker compose
        --env-file /var/www/bden/.env.prod
        -f /var/www/bden/docker-compose.prod.yml
        -p bden-prod
        config --quiet
      args:
        chdir: /var/www/bden

    - name: Build production images locally
      command: >
        docker compose
        --env-file /var/www/bden/.env.prod
        -f /var/www/bden/docker-compose.prod.yml
        -p bden-prod
        build
      args:
        chdir: /var/www/bden

    - name: Run Kubernetes deploy script
      command: >
        bash /var/www/bden/scripts/deploy-prod.sh
      args:
        chdir: /var/www/bden
```

### 14.6 — Run playbooks in order

```bash
cd infrastructure/ansible
ansible-galaxy collection install community.docker
ansible-playbook -i inventory.ini playbooks/01_install_docker.yml
ansible-playbook -i inventory.ini playbooks/02_configure_server.yml
ansible-playbook -i inventory.ini playbooks/03_deploy_services.yml
```

For today’s Jenkins-first path, you can skip Section 14 entirely and return to it later. The only non-negotiable security piece before going truly public is firewall correctness at both levels:

- Lightsail Networking tab
- VPS `ufw`

---

## Section 15 — Deploy Script

The Jenkinsfile is the authoritative deployment automation. The script below is for manual recovery or team debugging on the VPS. Use it when you are SSH'd into the server and want to deploy without waiting for a webhook.

There are now two supported modes:

- `k8s`: deploys to Kubernetes and routes host Nginx to `127.0.0.1:30080`.
- `compose`: deploys with `docker-compose.prod.yml` and routes host Nginx to `127.0.0.1:8088` for the frontend and `127.0.0.1:8080` for APIs.

If k3s pod networking is failing, use `compose` first so the public site works while the Kubernetes runtime is repaired.

### 15.1 — Manual deployment commands

**Compose fallback deploy:**

```bash
cd /var/www/bden
git pull origin main

docker compose \
  --env-file .env.prod \
  -f docker-compose.prod.yml \
  -p bden-prod \
  up -d --build --remove-orphans

sudo cp infrastructure/nginx/bden.host.compose.conf /etc/nginx/sites-available/bden
sudo ln -sf /etc/nginx/sites-available/bden /etc/nginx/sites-enabled/bden
sudo nginx -t
sudo systemctl reload nginx
```

**Kubernetes deploy retry:**

```bash
cd /var/www/bden
git pull origin main

kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/network-policy.yaml
kubectl create secret generic bden-env \
  --namespace=bden-prod \
  --from-env-file=.env.prod \
  --dry-run=client -o yaml | kubectl apply -f -

# Then trigger Jenkins or run the Jenkins deploy stage again.
```

✅ **CHECK after either mode:**

```bash
curl -I http://bden.hinkaku.tech
curl -fsS http://127.0.0.1:8088/health/ || true
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/ || true
```

At least one runtime health check should pass:

- Compose mode: `127.0.0.1:8088/health/` and `127.0.0.1:8080/health/`
- Kubernetes mode: `127.0.0.1:30080/health/`

This script is optional because the current `Jenkinsfile` already performs the production deploy directly. Keep it as a manual emergency deploy helper for the full k3s stack.

Save to `/var/www/bden/scripts/deploy-prod.sh`:

```bash
#!/bin/bash
# BDEN Production Deploy Script
set -e

ENV_FILE="/var/www/bden/.env.prod"
COMPOSE_FILE="/var/www/bden/docker-compose.prod.yml"
PROJECT="bden-prod"
NAMESPACE="bden-prod"
PUBLIC_HOST="bden.hinkaku.tech"
REGISTRY="localhost:5000"
DEPLOY_TAG="${BUILD_NUMBER:-manual-$(date +%Y%m%d%H%M%S)}"

check_url() {
  name="$1"
  url="$2"

  for attempt in $(seq 1 30); do
    if curl -fsS --max-time 5 -H "Host: ${PUBLIC_HOST}" "${url}" >/dev/null; then
      echo "${name} health check passed"
      return 0
    fi

    echo "Waiting for ${name} health check (${attempt}/30): ${url}"
    sleep 5
  done

  echo "ERROR: ${name} health check failed after retries: ${url}" >&2
  kubectl get pods -n "${NAMESPACE}" -o wide
  kubectl get events -n "${NAMESPACE}" --sort-by=.lastTimestamp | tail -80
  exit 1
}

rollout_status() {
  kind="$1"
  name="$2"
  timeout="${3:-240s}"

  if kubectl rollout status "${kind}/${name}" -n "${NAMESPACE}" --timeout="${timeout}"; then
    return 0
  fi

  echo "ERROR: rollout failed for ${kind}/${name}" >&2
  echo "--- Pods ---" >&2
  kubectl get pods -n "${NAMESPACE}" -o wide || true
  echo "--- ${kind}/${name} details ---" >&2
  kubectl describe "${kind}/${name}" -n "${NAMESPACE}" || true
  echo "--- Recent namespace events ---" >&2
  kubectl get events -n "${NAMESPACE}" --sort-by=.lastTimestamp | tail -120 || true
  echo "--- Logs for app=${name} ---" >&2
  kubectl logs -n "${NAMESPACE}" -l "app=${name}" --all-containers --tail=180 || true
  exit 1
}

publish_image() {
  compose_image="$1"
  registry_image="$2"

  docker tag "${compose_image}" "${REGISTRY}/bden/${registry_image}:latest"
  docker tag "${compose_image}" "${REGISTRY}/bden/${registry_image}:${DEPLOY_TAG}"
  docker push "${REGISTRY}/bden/${registry_image}:latest"
  docker push "${REGISTRY}/bden/${registry_image}:${DEPLOY_TAG}"
}

echo "=== BDEN Deploy: $(date) ==="
cd /var/www/bden

if [ ! -f "${ENV_FILE}" ]; then
  echo "ERROR: missing ${ENV_FILE}" >&2
  echo "Create it from .env.prod.example and fill production secrets before deploying." >&2
  exit 1
fi

echo "--- Pulling latest code..."
git pull origin main

echo "--- Validating production Compose..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" -p "${PROJECT}" config --quiet

echo "--- Building production images..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" -p "${PROJECT}" build

echo "--- Ensuring local registry exists..."
docker run -d \
  --restart unless-stopped \
  --name bden-local-registry \
  -p 127.0.0.1:5000:5000 \
  registry:2 2>/dev/null || docker start bden-local-registry

echo "--- Publishing images to local registry..."
publish_image "${PROJECT}-frontend:latest" frontend
publish_image "${PROJECT}-auth-service:latest" auth-service
publish_image "${PROJECT}-donor-service:latest" donor-service
publish_image "${PROJECT}-request-service:latest" request-service
publish_image "${PROJECT}-campaign-service:latest" campaign-service
publish_image "${PROJECT}-notification-service:latest" notification-service

echo "--- Applying Kubernetes manifests..."
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/network-policy.yaml
kubectl create secret generic bden-env \
  --namespace="${NAMESPACE}" \
  --from-env-file="${ENV_FILE}" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f infrastructure/k8s/data-services.yaml
kubectl apply -f infrastructure/k8s/app-services.yaml
kubectl apply -f infrastructure/k8s/event-consumers.yaml
kubectl apply -f infrastructure/k8s/frontend-gateway.yaml

kubectl set image deployment/frontend frontend="${REGISTRY}/bden/frontend:${DEPLOY_TAG}" -n "${NAMESPACE}"
kubectl set image deployment/auth-service auth-service="${REGISTRY}/bden/auth-service:${DEPLOY_TAG}" -n "${NAMESPACE}"
kubectl set image deployment/donor-service donor-service="${REGISTRY}/bden/donor-service:${DEPLOY_TAG}" -n "${NAMESPACE}"
kubectl set image deployment/request-service request-service="${REGISTRY}/bden/request-service:${DEPLOY_TAG}" -n "${NAMESPACE}"
kubectl set image deployment/campaign-service campaign-service="${REGISTRY}/bden/campaign-service:${DEPLOY_TAG}" -n "${NAMESPACE}"
kubectl set image deployment/notification-service notification-service="${REGISTRY}/bden/notification-service:${DEPLOY_TAG}" -n "${NAMESPACE}"
kubectl set image deployment/donor-event-consumer donor-event-consumer="${REGISTRY}/bden/donor-service:${DEPLOY_TAG}" -n "${NAMESPACE}"
kubectl set image deployment/request-event-consumer request-event-consumer="${REGISTRY}/bden/request-service:${DEPLOY_TAG}" -n "${NAMESPACE}"
kubectl set image deployment/notification-event-consumer notification-event-consumer="${REGISTRY}/bden/notification-service:${DEPLOY_TAG}" -n "${NAMESPACE}"
kubectl rollout restart deployment/gateway -n "${NAMESPACE}"

rollout_status deployment frontend 240s
rollout_status deployment auth-service 240s
rollout_status deployment donor-service 240s
rollout_status deployment request-service 240s
rollout_status deployment campaign-service 240s
rollout_status deployment notification-service 240s
rollout_status deployment gateway 240s

echo "--- Verifying health..."
check_url gateway "http://127.0.0.1:30080/health/"
check_url auth "http://127.0.0.1:30080/health/auth/"
check_url donor "http://127.0.0.1:30080/health/donor/"
check_url request "http://127.0.0.1:30080/health/request/"
check_url campaign "http://127.0.0.1:30080/health/campaign/"
check_url notification "http://127.0.0.1:30080/health/notification/"

echo "=== Deploy complete: $(date) ==="
```

```bash
sudo mkdir -p /var/www/bden/scripts
chmod +x /var/www/bden/scripts/deploy-prod.sh
```

Run it manually with:

```bash
bash /var/www/bden/scripts/deploy-prod.sh
```

Expected behavior:

```text
gateway health check passed
auth health check passed
donor health check passed
request health check passed
campaign health check passed
notification health check passed
=== Deploy complete: ...
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
    ├── 2. Compose validation — local and production files
    ├── 3. Backend checks/tests — all five Django services, unless DEPLOY_ONLY=true
    ├── 4. Frontend build — unless DEPLOY_ONLY=true
    ├── 5. Build production images — frontend, gateway, all services
    ├── 6. Deploy production Kubernetes stack — main only
    └── 7. Health checks — frontend + every service through the gateway
```

**Production traffic flow:**

```
Browser → https://bden.hinkaku.tech (port 443)
  → Host Nginx terminates SSL
  → proxy_pass to k3s gateway NodePort: 127.0.0.1:30080
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
notification-service → consumes → creates in-app notifications
```

---

## Section 19 — Full-System Infrastructure Setup

This section describes the current production deployment target for the whole BDEN system, not only auth and donor. The active production path is:

```
Jenkins → docker-compose.prod.yml image builds → local registry → k3s → host Nginx → HTTPS users
```

k3s is now the active production runtime. Docker Compose remains as the build/fallback path, but the public site should be served through the Kubernetes gateway NodePort `30080`.

### 19.1 — Production components that must run

The production stack must include every component below:

| Layer | Component | Compose service | Purpose |
|-------|-----------|-----------------|---------|
| Public UI | React frontend | `frontend` | Serves the built dashboard and landing UI |
| API gateway | Nginx gateway | `gateway` | Routes `/api/*` and `/health/*` to the correct service |
| Auth | Django auth service | `auth-service` | login, registration, JWT, Google auth, admin auth APIs |
| Donor | Django donor service | `donor-service` | donor profile, card, donations, nearby matching |
| Request | Django request service | `request-service` | emergency requests and donor responses |
| Campaign | Django campaign service | `campaign-service` | campaigns, myths, testimonials, banner ads |
| Notification | Django notification service | `notification-service` | in-app notifications and delivery records |
| Events | Donor consumer | `donor-event-consumer` | consumes request/campaign events and updates donor-side state |
| Events | Request consumer | `request-event-consumer` | consumes donation/response events for request state |
| Events | Notification consumer | `notification-event-consumer` | consumes domain events and creates notifications |
| Data | Postgres auth DB | `auth-db` | auth service database |
| Data | Postgres donor DB | `donor-db` | donor service database |
| Data | Postgres request DB | `request-db` | request service database |
| Data | Postgres campaign DB | `campaign-db` | campaign service database |
| Data | Postgres notification DB | `notification-db` | notification service database |
| Cache/events | Redis | `redis` | event bus, cache, async coordination |

✅ **CHECK:**

```bash
kubectl get pods -n bden-prod -o wide
kubectl get svc -n bden-prod
```

Expected behavior: every pod is `Running` or `Completed`, and the `gateway` service exposes NodePort `30080`.

### 19.2 — Files that control the production deployment

These are the files that matter for the current production infrastructure:

| File | Required change? | Why |
|------|------------------|-----|
| `Jenkinsfile` | **Yes, keep current prod deploy flow** | It validates Compose, builds all images, starts the full `bden-prod` stack, and checks every health endpoint. |
| `docker-compose.prod.yml` | **Yes, build definition/fallback** | Jenkins uses it to build production images before pushing to the local registry. |
| `.env.prod` on VPS | **Yes, server-only file** | It supplies real secrets, DB passwords, OAuth values, host ports, and production URLs. |
| `.env.prod.example` | **Yes, template only** | It documents the required variables for teammates without exposing secrets. |
| `infrastructure/k8s/*` | **Yes, active runtime manifests** | It defines namespaces, data services, Django services, consumers, frontend, and gateway. |
| `infrastructure/nginx/bden.host.k8s.conf` | **Yes, host Nginx reference** | It routes public BDEN traffic to `127.0.0.1:30080`. |
| `/etc/nginx/sites-available/bden` on VPS | **Yes, host Nginx config** | It terminates public HTTP/HTTPS and proxies to the k3s gateway, Jenkins, and Grafana. |

### 19.3 — Production port model

Only host Nginx should be public on `80` and `443`. Kubernetes exposes the app internally on the VPS:

| Component | Host binding |
|-----------|--------------|
| BDEN gateway | `127.0.0.1:30080` |
| Local image registry | `127.0.0.1:5000` |
| App services | ClusterIP inside `bden-prod` namespace |
| Databases and Redis | StatefulSet pods with Services; Jenkins temporarily wires endpoint IPs while k3s DNS/service routing is unstable |

> ⚠️ Do not open `30080`, `5000`, service ports, database ports, or Redis publicly in Lightsail. Host Nginx is still the only public entry point.

### 19.4 — Deploy or redeploy the full system manually

Manual deploy is useful when Jenkins is being configured or when you are debugging the VPS:

```bash
cd /var/www/bden
git pull origin main

bash /var/www/bden/scripts/deploy-prod.sh
```

✅ **CHECK:**

```bash
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/auth/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/donor/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/request/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/campaign/
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/notification/
```

Expected behavior: each command returns JSON and exits successfully.

### 19.5 — Jenkins production deployment behavior

Jenkins deploys the full system to k3s:

1. resolves `/var/www/bden/.env.prod`;
2. validates `docker-compose.prod.yml`;
3. builds the frontend, gateway, and all Django service images;
4. pushes images to `localhost:5000/bden/*`;
5. creates/updates `bden-env` from `.env.prod`;
6. applies the Kubernetes manifests;
7. waits for rollouts;
8. checks every service health endpoint through `127.0.0.1:30080`.

The deploy health checks call the gateway through `127.0.0.1`, but they send the public host header:

```bash
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/auth/
```

That matters because Django validates `ALLOWED_HOSTS`. The server `.env.prod` should still include:

```dotenv
ALLOWED_HOSTS=bden.hinkaku.tech,localhost,127.0.0.1,host.docker.internal,auth-service,donor-service,request-service,campaign-service,notification-service
```

### 19.6 — Compose fallback

Use Compose only as a temporary fallback if k3s is unavailable. If you switch to fallback mode, also switch host Nginx back to the Compose routing file that points `/` to `8088` and `/api/` to `8080`.

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
- [ ] `kubectl get nodes` (shows k3s `Ready`, future orchestration baseline)
- [ ] `docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod ps` (all production containers up)
- [ ] `docker ps` on VPS (all BDEN containers up)
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
- [ ] Optional future registry: Docker Hub or another image registry showing versioned BDEN images

---

## Section 22 — Maintenance and Ongoing Operations

### Update a single service without full pipeline

```bash
cd /var/www/bden
git pull origin main
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod \
  build auth-service
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod \
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
# Kubernetes production mode
cd /var/www/bden
kubectl logs -l app=auth-service -n bden-prod --tail=100 -f
```

### Django shell on production

```bash
# Kubernetes production mode
cd /var/www/bden
kubectl exec -it deployment/auth-service -n bden-prod \
  -- python manage.py shell
```

### Backup all databases

```bash
sudo mkdir -p /var/backups/bden
DATE=$(date +%Y%m%d_%H%M%S)

for db in auth donor request campaign notification; do
  docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod \
    exec ${db}-db pg_dump -U bden_${db}_user bden_${db} \
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

# Deploy all services through k3s
cd /var/www/bden
bash /var/www/bden/scripts/deploy-prod.sh

# View all production pods
kubectl get pods -n bden-prod -o wide

# View logs
kubectl logs -n bden-prod deployment/auth-service --tail=100 -f

# Run migrations manually if needed
kubectl exec -n bden-prod deployment/auth-service -- python manage.py migrate

# Check gateway health
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/

# Restart Jenkins
sudo systemctl restart jenkins

# Reload Bitnami Apache safely
sudo /opt/bitnami/apache/bin/apachectl -t && sudo /opt/bitnami/ctlscript.sh restart apache

# If using system Nginx instead:
sudo nginx -t && sudo systemctl reload nginx

# Future k3s mode only: check pods
kubectl get pods -n bden-prod

# Future k3s mode only: force redeploy a service
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
- [ ] `kubectl get secrets -n bden-prod` shows `bden-env`

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
- [ ] `kubectl get pods -n bden-prod` → app pods are `Running`
- [ ] All migrations ran without errors
- [ ] `curl -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/auth/` → service health JSON
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
- [ ] Production images are rebuilt by Jenkins on the VPS
- [ ] `kubectl get pods -n bden-prod` shows freshly recreated pods
- [ ] `https://bden.hinkaku.tech` still loads and API health checks pass

---

## Troubleshooting

### Docker build cannot resolve Debian repositories

If Jenkins fails during image build with:

```text
Temporary failure resolving 'deb.debian.org'
E: Unable to locate package build-essential
```

the pipeline has not reached Django tests yet. Docker cannot resolve package repositories during `apt-get update`.

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

Then retry one image build:

```bash
cd /var/www/bden
docker compose --env-file .env.example -p bden-ci build request-service
```

### Kubernetes service DNS fails during deploy

If Jenkins shows app logs like this during the Kubernetes rollout:

```text
waiting for auth-db:5432: [Errno -3] Temporary failure in name resolution
```

the service image was pulled correctly, but the pod could not resolve Kubernetes service names through CoreDNS. Check the cluster DNS before blaming Django or Docker images:

```bash
kubectl rollout status deployment/coredns -n kube-system --timeout=180s
kubectl get pods -n kube-system -o wide
kubectl logs -n kube-system deployment/coredns --all-containers --tail=200

kubectl apply -f /var/www/bden/infrastructure/k8s/network-policy.yaml
kubectl get networkpolicy -A
kubectl get svc kube-dns -n kube-system -o wide
kubectl get svc,endpoints -n bden-prod
kubectl delete pod bden-dns-check -n bden-prod --ignore-not-found=true
kubectl run bden-dns-check -n bden-prod --image=busybox:1.36 --restart=Never --command -- sleep 300
kubectl wait --for=condition=Ready pod/bden-dns-check -n bden-prod --timeout=90s
kubectl exec -n bden-prod bden-dns-check -- cat /etc/resolv.conf
kubectl exec -n bden-prod bden-dns-check -- nslookup kubernetes.default.svc.cluster.local
kubectl exec -n bden-prod bden-dns-check -- nslookup auth-db.bden-prod.svc.cluster.local
kubectl delete pod bden-dns-check -n bden-prod --ignore-not-found=true
```

Expected behavior: `nslookup` returns a ClusterIP for `auth-db.bden-prod.svc.cluster.local`.

If it fails:

```bash
sudo systemctl restart k3s
kubectl wait --for=condition=Ready node --all --timeout=180s
kubectl rollout status deployment/coredns -n kube-system --timeout=180s
```

Then rerun the Jenkins deploy. The current Jenkinsfile includes this DNS preflight and prints CoreDNS logs if cluster DNS is still broken.

`infrastructure/k8s/network-policy.yaml` intentionally permits runtime traffic inside `bden-prod` and DNS traffic to CoreDNS. This avoids accidental default-deny behavior while the production MVP is still being stabilized. Tighten this later once the deployment is green.

The Jenkinsfile also has a temporary IP-based bypass for this exact issue. If CoreDNS still cannot resolve service names, Jenkins continues by reading the Kubernetes endpoint IPs for DB/Redis and the `ClusterIP` values for frontend/backend services, then injects those IPs into the Django deployments and regenerates the gateway ConfigMap with direct upstream IPs.

DB/Redis use endpoint IPs instead of ClusterIPs because this VPS k3s install has shown both DNS and ClusterIP service routing instability. This is a bootstrap workaround, not the final ideal state.

Once CoreDNS is healthy, remove the bypass and return to normal Kubernetes service DNS names.

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
cd /var/www/bden
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod logs auth-service
# Look for: missing SECRET_KEY, DB connection refused, missing .env values
```

### Database connection refused

```bash
cd /var/www/bden
docker compose --env-file .env.prod -f docker-compose.prod.yml -p bden-prod \
  exec auth-db psql -U bden_auth_user -d bden_auth -c "SELECT 1"
# If this fails: check AUTH_DB_PASSWORD in .env matches the container env
```

### Nginx 502 Bad Gateway

```bash
# Check the Kubernetes gateway and pods
kubectl get pods -n bden-prod -o wide
kubectl get svc -n bden-prod
curl -fsS -H "Host: bden.hinkaku.tech" http://127.0.0.1:30080/health/

# Check Nginx is proxying to the correct port
sudo nginx -T | grep proxy_pass
```

Expected host Nginx proxy for the public BDEN site:

```text
proxy_pass http://127.0.0.1:30080;
```

If Nginx still points to `8088` or `8080`, copy the k8s host config and reload:

```bash
cd /var/www/bden
sudo cp infrastructure/nginx/bden.host.k8s.conf /etc/nginx/sites-available/bden
sudo ln -sf /etc/nginx/sites-available/bden /etc/nginx/sites-enabled/bden
sudo nginx -t
sudo systemctl reload nginx
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
# 1. Check whether the conflict is from host Nginx, Jenkins, Grafana, or the local registry.
# 2. Do not expose app/database/Redis ports directly. Kubernetes should use ClusterIP services.
kubectl get svc -n bden-prod
```

