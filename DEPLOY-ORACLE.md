# 🚀 Groway Merchant OS — Oracle Cloud Deployment Guide

**Designed and Built by Motheto Selepe**

This guide walks you through deploying the Groway Merchant OS to an Oracle Cloud Infrastructure (OCI) server, end to end. No prior DevOps experience required.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [What You'll Need](#2-what-youll-need)
3. [Step 1 — Create an Oracle Cloud Account](#step-1--create-an-oracle-cloud-account)
4. [Step 2 — Launch a Free ARM Instance](#step-2--launch-a-free-arm-instance)
5. [Step 3 — Configure Security (Firewall)](#step-3--configure-security-firewall)
6. [Step 4 — Connect to Your Server](#step-4--connect-to-your-server)
7. [Step 5 — Install Docker](#step-5--install-docker)
8. [Step 6 — Transfer the Source Code](#step-6--transfer-the-source-code)
9. [Step 7 — Configure Environment](#step-7--configure-environment)
10. [Step 8 — Build & Launch](#step-8--build--launch)
11. [Step 9 — Point Your Domain](#step-9--point-your-domain)
12. [Step 10 — Verify](#step-10--verify)
13. [Day-to-Day Operations](#day-to-day-operations)
14. [Troubleshooting](#troubleshooting)

---

## 1. Architecture Overview

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │  Oracle Cloud   │
              │  ARM Instance   │
              │  (Always Free)  │
              │                 │
              │  ┌───────────┐  │
              │  │  Caddy    │  │  ← Automatic HTTPS (Let's Encrypt)
              │  │  :80/:443 │  │
              │  └─────┬─────┘  │
              │        │        │
              │  ┌─────▼─────┐  │
              │  │  Next.js  │  │  ← Groway Merchant OS (port 3000)
              │  │  App      │  │
              │  └─────┬─────┘  │
              │        │        │
              │  ┌─────▼─────┐  │
              │  │  SQLite   │  │  ← Persistent volume (survives restarts)
              │  │  groway.db│  │
              │  └───────────┘  │
              └─────────────────┘
```

**Stack:** Next.js 16 + Prisma + SQLite + Bun runtime + Caddy (reverse proxy + SSL)  
**Cost:** ₹0 (Oracle Always Free tier: 4 ARM cores + 24GB RAM)  
**Setup time:** ~45 minutes

---

## 2. What You'll Need

- [ ] A domain name (e.g., `groway.yourdomain.co.za`) — optional but recommended for HTTPS
- [ ] Oracle Cloud account (free to create)
- [ ] SSH key pair (for secure server access)
- [ ] The Groway source code (from your development environment)

**Generate an SSH key pair** (if you don't have one):
```bash
# On your local machine:
ssh-keygen -t ed25519 -C "groway-oracle" -f ~/.ssh/groway-oracle
# This creates:
#   ~/.ssh/groway-oracle      (private key — KEEP SAFE)
#   ~/.ssh/groway-oracle.pub  (public key — upload to Oracle)
```

---

## Step 1 — Create an Oracle Cloud Account

1. Go to **https://www.oracle.com/cloud/free/**
2. Click **"Start for free"**
3. Sign up with your email + phone + credit card (card is for verification only — **you will NOT be charged** on the Always Free tier)
4. Choose a **home region** close to your users:
   - South Africa → **Johannesburg** (`af-johannesburg-1`) — best for SA users
   - Europe → **Frankfurt** or **Amsterdam**
   - US → **Ashburn** or **Phoenix**
5. Wait for the account to be provisioned (can take 5–30 minutes)

---

## Step 2 — Launch a Free ARM Instance

Oracle's Always Free tier includes **4 OCPU + 24GB RAM** of ARM compute (Ampere A1). This is more than enough.

1. In the OCI Console, go to **Compute → Instances → Create Instance**
2. Configure:
   - **Name:** `groway-prod`
   - **Image:** Canonical Ubuntu 22.04 (click "Change image" → Ubuntu)
   - **Shape:** Click "Change shape" → 
     - Shape type: **Ampere** (ARM-based)
     - Shape: **VM.Standard.A1.Flex**
     - OCPUs: **4**
     - Memory: **24 GB**
   - **SSH keys:** Upload your `groway-oracle.pub` public key (or paste it)
   - **Boot volume:** Leave defaults (47 GB is fine)
3. Click **Create**

Wait ~2 minutes for the instance to be `RUNNING`. Note the **Public IP Address** shown on the instance details page.

---

## Step 3 — Configure Security (Firewall)

Oracle has two layers of firewall. You must open ports in BOTH:

### 3a. Oracle Cloud Security List (VCN level)

1. Go to **Networking → Virtual Cloud Networks** → click your VCN → **Security Lists** → default security list
2. Click **Add Ingress Rules**:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: `TCP`
   - Destination Port Range: `80,443`  (for HTTP + HTTPS)
   - Click **Add Ingress Rules**
3. Add another rule for SSH (if not already present):
   - Source CIDR: `0.0.0.0/0` (or restrict to your IP for better security)
   - Destination Port Range: `22`

### 3b. Ubuntu OS Firewall (iptables)

```bash
# SSH into the server first (see Step 4), then run:
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## Step 4 — Connect to Your Server

```bash
# From your local machine:
ssh -i ~/.ssh/groway-oracle ubuntu@<YOUR_SERVER_PUBLIC_IP>

# Example:
ssh -i ~/.ssh/groway-oracle ubuntu@129.159.42.100
```

Type `yes` when prompted to accept the host key.

---

## Step 5 — Install Docker

Run these commands on your Oracle server (via SSH):

```bash
# Update the system
sudo apt update && sudo apt upgrade -y

# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sudo sh

# Add your user to the docker group (so you don't need 'sudo' every time)
sudo usermod -aG docker $USER

# Apply the group change
newgrp docker

# Verify
docker --version
docker compose version
```

---

## Step 6 — Transfer the Source Code

You need to get the Groway source code from your development machine onto the Oracle server. **Do NOT copy `node_modules` or `.next`** — these will be rebuilt on the server.

### Option A: Using Git (Recommended)

If your code is in a Git repository:

```bash
# On the Oracle server:
cd ~
git clone https://github.com/YOUR_USERNAME/groway-merchant-os.git groway
cd groway
```

### Option B: Using SCP (if no Git repo)

From your **local** development machine:

```bash
# Create a clean archive (excludes node_modules, .next, database, logs)
cd /path/to/groway
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dev.db' \
    --exclude='*.log' \
    --exclude='video-assets' \
    --exclude='verify' \
    -czf /tmp/groway-source.tar.gz .

# Transfer to Oracle server
scp -i ~/.ssh/groway-oracle /tmp/groway-source.tar.gz ubuntu@<SERVER_IP>:~/

# SSH in and extract
ssh -i ~/.ssh/groway-oracle ubuntu@<SERVER_IP>
mkdir -p ~/groway && cd ~/groway
tar -xzf ~/groway-source.tar.gz
rm ~/groway-source.tar.gz
```

### Verify the transfer

```bash
cd ~/groway
ls -la
# You should see:
#   Dockerfile
#   docker-compose.yml
#   docker-entrypoint.sh
#   Caddyfile.prod
#   .env.production.example
#   package.json
#   next.config.ts
#   prisma/
#   src/
#   scripts/
#   public/
```

---

## Step 7 — Configure Environment

```bash
cd ~/groway

# Copy the example env file
cp .env.production.example .env

# Edit it
nano .env
```

Set these values:

```bash
# Your domain (or the server's IP if you don't have a domain yet)
DOMAIN=groway.yourdomain.co.za
NEXT_PUBLIC_APP_URL=https://groway.yourdomain.co.za
NEXT_PUBLIC_BASE_URL=https://groway.yourdomain.co.za

# Generate a strong JWT secret:
# Run this in a separate terminal:  openssl rand -base64 32
JWT_SECRET=paste_the_generated_secret_here
```

Save (`Ctrl+O`, `Enter`) and exit (`Ctrl+X`).

### Also update the Caddyfile.prod with your domain:

```bash
sed -i 's/groway.example.com/groway.yourdomain.co.za/g' Caddyfile.prod
```

---

## Step 8 — Build & Launch

```bash
cd ~/groway

# Build and start (this takes ~10 minutes on ARM for the first build)
docker compose up -d --build

# Watch the logs (press Ctrl+C to exit, app keeps running)
docker compose logs -f
```

You'll see:
```
groway    | === Groway Merchant OS — Starting ===
groway    |   Pushing database schema...
groway    |   First boot detected — seeding demo data...
groway    |   Seeding complete.
groway    |   Starting Next.js server on port 3000...
groway    |   ▲ Next.js 16.1.3
groway    |   - Local: http://localhost:3000
groway    |   ✓ Ready in 2.3s
caddy     | {"level":"info","msg":"serving initial configuration"}
```

When you see `✓ Ready`, the app is live. Press `Ctrl+C` to exit the log view (the app keeps running in the background).

---

## Step 9 — Point Your Domain

### If you have a domain:

1. Go to your domain registrar's DNS settings (e.g., Afrihost, domains.co.za, Cloudflare)
2. Create an **A Record**:
   - **Name/Host:** `groway` (for `groway.yourdomain.co.za`) or `@` (for `yourdomain.co.za`)
   - **Value/Target:** `<YOUR_SERVER_PUBLIC_IP>`
   - **TTL:** 300 (5 minutes)
3. Wait for DNS to propagate (check with `dig groway.yourdomain.co.za` — should resolve to your server IP)

**Caddy will automatically obtain an SSL certificate from Let's Encrypt** the first time someone visits your domain. This takes ~30 seconds.

### If you don't have a domain:

You can access the app directly via IP: `http://<YOUR_SERVER_PUBLIC_IP>`  
(HTTPS won't work without a domain — fine for testing, not for production)

---

## Step 10 — Verify

1. Open your browser
2. Go to `https://groway.yourdomain.co.za` (or `http://<SERVER_IP>` if no domain)
3. You should see the Groway landing page
4. Go to `/merchant-os/login`
5. Login with demo credentials:
   - **Spaza:** `spaza@groway.co.za` / `demo1234`
   - **Restaurant:** `restaurant@groway.co.za` / `demo1234`
   - **Salon:** `salon@groway.co.za` / `demo1234`
   - **Pharmacy:** `pharmacy@groway.co.za` / `demo1234`
6. Navigate to the **SAPE** module in the sidebar — verify the counterfeit-detection demo works

---

## Day-to-Day Operations

### View logs

```bash
cd ~/groway
docker compose logs -f          # all services
docker compose logs -f groway   # just the app
docker compose logs -f caddy    # just the proxy
```

### Restart the app

```bash
cd ~/groway
docker compose restart
```

### Update to a new version

```bash
cd ~/groway

# Pull the latest code (if using Git)
git pull origin main

# Rebuild + restart
docker compose up -d --build

# (Your database is in a Docker volume — it survives rebuilds)
```

### Backup the database

```bash
# The SQLite database is in a Docker volume. Back it up:
docker compose exec groway cat /app/data/groway.db > ~/groway-backup-$(date +%Y%m%d).db

# Or copy the volume directly:
docker run --rm -v groway_groway-db:/data -v $(pwd):/backup alpine \
  cp /data/groway.db /backup/groway-backup-$(date +%Y%m%d).db
```

### Set up automatic daily backups (cron)

```bash
crontab -e
# Add this line (backs up at 3am daily):
0 3 * * * docker run --rm -v groway_groway-db:/data -v /home/ubuntu/backups:/backup alpine cp /data/groway.db /backup/groway-$(date +\%Y\%m\%d).db
```

### Check system health

```bash
# CPU + memory
htop

# Disk space
df -h

# Docker container status
docker compose ps

# App health endpoint
curl http://localhost:3000/api/platform/health
```

### Stop the app

```bash
cd ~/groway
docker compose down
# (Database volume is preserved)
```

### Stop + delete everything (including database)

```bash
cd ~/groway
docker compose down -v
# ⚠️ This deletes your database! Only do this if you want a fresh start.
```

---

## Troubleshooting

### "Connection refused" on port 80/443

**Cause:** Oracle firewall not configured.  
**Fix:** Re-do [Step 3](#step-3--configure-security-firewall) — both the VCN Security List AND the Ubuntu iptables rules.

### "curl: (7) Failed to connect" to localhost:3000

**Cause:** App container not running.  
**Fix:**
```bash
docker compose ps          # check if it's running
docker compose logs groway  # check for errors
docker compose up -d        # restart
```

### Caddy can't get SSL certificate

**Cause:** DNS not pointing to your server yet, or ports 80/443 not open.  
**Fix:**
```bash
# Check DNS
dig groway.yourdomain.co.za
# Should return your server's IP

# Check Caddy logs
docker compose logs caddy

# Manually restart Caddy after DNS propagates
docker compose restart caddy
```

### Build fails with "out of memory"

**Cause:** ARM instance under memory pressure during build.  
**Fix:**
```bash
# Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Retry the build
docker compose up -d --build
```

### Database locked error

**Cause:** Two processes trying to write to SQLite simultaneously.  
**Fix:**
```bash
docker compose down
docker compose up -d
```

### Can't SSH in

**Cause:** SSH key not set up correctly.  
**Fix:**
1. In OCI Console → Compute → Instances → your instance → click **Instance details**
2. Scroll to **Resources → SSH keys** — verify your public key is there
3. Re-connect with the correct private key:
   ```bash
   ssh -i ~/.ssh/groway-oracle ubuntu@<SERVER_IP>
   ```

### App is slow

**Cause:** Not enough resources allocated.  
**Fix:**
- The free tier gives you 4 ARM cores + 24GB RAM — ensure you allocated all of them
- Check if another process is consuming resources: `htop`
- Increase the Node heap in docker-compose.yml:
  ```yaml
  environment:
    - NODE_OPTIONS=--max-old-space-size=2048
  ```

---

## Demo Credentials (Pre-seeded)

The Docker entrypoint automatically seeds these accounts on first boot:

| Vertical | Email | Password | Business |
|---|---|---|---|
| Spaza Shop | `spaza@groway.co.za` | `demo1234` | Mama Thandi Spaza Shop |
| Restaurant | `restaurant@groway.co.za` | `demo1234` | The Hungry Fork |
| Beauty Salon | `salon@groway.co.za` | `demo1234` | Glamour Hair Studio |
| Pharmacy | `pharmacy@groway.co.za` | `demo1234` | CityMed Pharmacy |
| Admin Console | `admin@groway.co.za` | `admin1234` | System Admin |

**⚠️ Change these passwords before going live.** After first boot, SSH in and update:
```bash
docker compose exec groway bun run scripts/change-password.ts
```
(Or just remove the seed step from `docker-entrypoint.sh` for production.)

---

## Production Hardening Checklist

Before accepting real users:

- [ ] Generate a new `JWT_SECRET` (32+ random chars)
- [ ] Change all demo passwords (or disable demo accounts)
- [ ] Enable Oracle Cloud **Cloud Guard** (free threat detection)
- [ ] Set up automated daily database backups (see above)
- [ ] Configure Oracle **object storage** for off-site backup rotation
- [ ] Restrict SSH (port 22) to your IP only in the VCN Security List
- [ ] Add a custom domain + verify HTTPS is working
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production HTTPS URL
- [ ] Test the SAPE module end-to-end (authentic + counterfeit scans)
- [ ] Monitor logs for the first 24 hours: `docker compose logs -f`

---

## Support

**Designed and Built by Motheto Selepe**  
Groway Merchant OS — Built for the township economy.

For issues, check the logs first:
```bash
docker compose logs --tail=100 groway
```

---

## Quick Reference

| What | Command |
|---|---|
| Start app | `docker compose up -d` |
| Stop app | `docker compose down` |
| Restart app | `docker compose restart` |
| View logs | `docker compose logs -f` |
| Rebuild after code change | `docker compose up -d --build` |
| Backup database | `docker compose exec groway cat /app/data/groway.db > backup.db` |
| Check health | `curl http://localhost:3000/api/platform/health` |
| SSH in | `ssh -i ~/.ssh/groway-oracle ubuntu@<SERVER_IP>` |
