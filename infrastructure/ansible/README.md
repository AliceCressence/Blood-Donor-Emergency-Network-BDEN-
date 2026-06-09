# BDEN Ansible Infrastructure

These playbooks make the VPS setup repeatable while keeping production secrets on the server.

## Files

- `inventory.example.ini` - sample VPS inventory. Copy it to `inventory.ini` and update the PEM path.
- `group_vars/bden_vps.example.yml` - sample variables. Copy it to `group_vars/bden_vps.yml` before running.
- `playbooks/site.yml` - prepares the server: packages, Docker, Nginx, optional Jenkins, optional k3s, repo checkout, monitoring files.
- `playbooks/deploy-compose-fallback.yml` - starts the production Compose fallback and points Nginx to it.
- `playbooks/deploy-monitoring.yml` - starts Prometheus and Grafana with the BDEN datasource and starter dashboard.
- `templates/bden-compose-nginx.conf.j2` - SSL-aware Nginx config for the Compose fallback.

## Usage

```bash
cd infrastructure/ansible
cp inventory.example.ini inventory.ini
cp group_vars/bden_vps.example.yml group_vars/bden_vps.yml
ansible-playbook playbooks/site.yml
```

Make sure `/var/www/bden/.env.prod` exists on the VPS before deploying.

```bash
ansible-playbook playbooks/deploy-compose-fallback.yml
```

Deploy or refresh monitoring:

```bash
ansible-playbook playbooks/deploy-monitoring.yml
```

Kubernetes remains the target runtime, but Compose fallback is intentionally supported while k3s networking is being repaired.
