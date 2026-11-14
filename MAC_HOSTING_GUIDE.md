# Groway Merchant OS — Mac Hosting Guide

> Host the full Groway Merchant OS (Next.js 16 + Prisma + Bun) on your own Mac.
> This replaces the 4 GB / limited-storage cloud sandbox with a persistent local
> dev environment. Per the Tshepo Master Build Document section 5, the Mac is the
> development and staging target — never for live customer money.

## Quick Start (5 commands)

```bash
# 1. Clone or unbundle the repo
git clone groway-grocore.bundle groway-merchant-os
cd groway-merchant-os
git remote remove origin 2>/dev/null

# 2. Install dependencies
bun install

# 3. Set up the database
cp .env.example .env
bun run db:push
bun run db:generate

# 4. Seed demo data
bun run scripts/comprehensive-seed.ts

# 5. Start the dev server
bun run dev
```

Open `http://localhost:3000` in your browser. Done.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Get the Code onto Your Mac](#2-get-the-code-onto-your-mac)
3. [Install Dependencies](#3-install-dependencies)
4. [Environment Configuration](#4-environment-configuration)
5. [Database Setup](#5-database-setup)
6. [Seed Demo Data](#6-seed-demo-data)
7. [Run the Dev Server](#7-run-the-dev-server)
8. [Verify It Works](#8-verify-it-works)
9. [Production Mode (Optional)](#9-production-mode-optional)
10. [Remote Access via Cloudflare Tunnel (Optional)](#10-remote-access-via-cloudflare-tunnel-optional)
11. [Backups](#11-backups)
12. [Common Issues](#12-common-issues)
13. [Updating the Codebase](#13-updating-the-codebase)
14. [Moving to PostgreSQL](#14-moving-to-postgresql)

---

## 1. Prerequisites

Install these on your Mac. All are free.

### Bun (the runtime we use)

```bash
brew tap oven-sh/bun
brew install bun
bun --version  # should print 1.1.x or higher
```

### Node.js 20 (fallback, for some tooling)

```bash
brew install node@20
node --version  # v20.x.x
```

### Git

```bash
brew install git
git --version
```

### (Optional) PostgreSQL 16 — only if you want to move off SQLite

```bash
brew install postgresql@16
brew services start postgresql@16
```

SQLite (the default) is fine for development and single-user staging. Switch to
Postgres before going live with real customers.

### Verify

```bash
bun --version && node --version && git --version
```

All three should print version numbers without errors.

---

## 2. Get the Code onto Your Mac

You have two options.

### Option A: Git bundle (recommended — no GitHub needed)

The sandbox has already created a git bundle with the full history + GroCore.

**On the sandbox** (already done):
```bash
cd /home/z/my-project
git bundle create /tmp/groway-grocore.bundle --all
```

**Copy the bundle to your Mac** (via scp, rsync, AirDrop, or a USB drive):
```bash
# From your Mac, if you can SSH to the sandbox:
scp user@sandbox-ip:/tmp/groway-grocore.bundle ~/Downloads/

# Or download via whatever file transfer method you have.
```

**On your Mac, unbundle it:**
```bash
cd ~/Projects   # or wherever you keep code
git clone ~/Downloads/groway-grocore.bundle groway-merchant-os
cd groway-merchant-os
git remote remove origin 2>/dev/null
git log --oneline -5   # should show "Restore GroCore financial services engine"
```

### Option B: Push to a private GitHub repo first

```bash
# On the sandbox:
cd /home/z/my-project
gh repo create groway-merchant-os --private --source=. --push
# (requires `gh auth login` first)

# On your Mac:
git clone git@github.com:your-username/groway-merchant-os.git
cd groway-merchant-os
```

---

## 3. Install Dependencies

```bash
cd groway-merchant-os
bun install
```

This installs ~400 packages and generates the Prisma client. It takes 2-5 minutes
on a fresh Mac. The `postinstall` script runs `prisma generate` automatically.

**If you see a Prisma error** about the client not being generated:
```bash
bun run db:generate
```

---

## 4. Environment Configuration

```bash
cp .env.example .env
```

Open `.env` in your editor and set these:

```env
# Database — SQLite for dev (file-based, no server needed)
DATABASE_URL="file:./dev.db"

# JWT secret — generate a strong one:
# Run: openssl rand -base64 32
# Paste the output below:
JWT_SECRET=your-generated-secret-here

# Base URL — your Mac's local address
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# OAuth (optional — only if you want Google/Apple sign-in)
# Leave blank to skip OAuth; email/password login still works
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Generate a JWT secret:**
```bash
openssl rand -base64 32
# Copy the output into .env as JWT_SECRET=
```

---

## 5. Database Setup

### SQLite (default — fastest, no install needed)

```bash
bun run db:push
```

This creates `dev.db` in the project root and applies all 309 Prisma models
(including the 13 GroCore models: GroCoreAccount, GroCoreEntry, GroCoreLine,
GroCoreConsent, GroCoreDecision, GroCoreAdvance, GroCoreRecovery,
GroCoreGoPaySettlement, GroCoreGoPayCapture, GroCoreCapitalSource,
GroCoreVoucher, GroCoreDeviceContract, GroCoreDevicePayment).

You should see:
```
🚀  Your database is now in sync with your Prisma schema.
Running generate... ✔ Generated Prisma Client
```

### PostgreSQL (optional — for staging or if you prefer a real DB)

```bash
# 1. Start Postgres
brew services start postgresql@16
createdb groway

# 2. Edit prisma/schema.prisma — change the datasource:
#    datasource db {
#      provider = "postgresql"
#      url      = env("DATABASE_URL")
#    }

# 3. Update .env:
#    DATABASE_URL="postgresql://$(whoami)@localhost:5432/groway?schema=public"

# 4. Push the schema
bun run db:push
```

---

## 6. Seed Demo Data

```bash
bun run scripts/comprehensive-seed.ts
```

This seeds:
- 5 demo merchants (spaza, restaurant, salon, pharmacy + admin)
- 350 GroSupply suppliers
- Product catalog
- Demo users with passwords

**Demo login credentials:**

| Email | Password | Role |
|-------|----------|------|
| `spaza@groway.co.za` | `demo1234` | Spaza shop owner |
| `restaurant@groway.co.za` | `demo1234` | Restaurant owner |
| `salon@groway.co.za` | `demo1234` | Salon owner |
| `pharmacy@groway.co.za` | `demo1234` | Pharmacy owner |
| `admin@groway.co.za` | `admin1234` | Platform admin |

---

## 7. Run the Dev Server

```bash
bun run dev
```

You should see:
```
▲ Next.js 16.1.3 (Turbopack)
- Local:        http://localhost:3000
✓ Ready in 2.4s
```

The dev server has hot reload via Turbopack. Edit a file and the page updates
instantly. Logs are written to `dev.log` (tee'd from stdout).

**To stop the server:** `Ctrl+C`

**To run in the background:**
```bash
nohup bun run dev > dev.log 2>&1 &
echo $! > server.pid
```

---

## 8. Verify It Works

Open `http://localhost:3000` in your browser. You should see:

1. **Homepage** — "Africa's Integrated Financial Operating System" with the
   Superapp Platform section showing all 9 apps including **GroCore** (teal card
   with "R 4.2B+ deployed")

2. **GroCore landing** — Visit `http://localhost:3000/grocore` to see the GroCore
   marketing page

3. **GroCore dashboard** — Click "Login to GroCore" on the landing page, or visit
   `http://localhost:3000/grocore/login`. Use `spaza@groway.co.za / demo1234`.
   You'll see the full dashboard with 9 views: Overview, Ledger, Consent,
   Decisioning, Top-up Advances, Vouchers, Capital Grid, GoPay Settlement,
   Device Finance.

4. **Merchant OS** — Visit `http://localhost:3000/merchant-os/login` and sign in.
   The sidebar Finance section now includes "GroCore" (between GroCredit and
   Enterprise Portal).

### Quick smoke test

```bash
# Homepage loads
curl -s -o /dev/null -w "Homepage: %{http_code}\n" http://localhost:3000/

# GroCore landing loads
curl -s -o /dev/null -w "GroCore landing: %{http_code}\n" http://localhost:3000/grocore

# GroCore API works (list capital sources)
curl -s -H "x-tenant-id: demo-tenant" \
  http://localhost:3000/merchant-os/api/grocore/capital-sources | head -c 100
```

Expected:
```
Homepage: 200
GroCore landing: 200
{"items":[],"count":0}
```

---

## 9. Production Mode (Optional)

For staging or if you want the faster production build:

```bash
bun run build
bun run start
```

Production build uses ~350 MB RAM vs ~1.1 GB for dev mode.

### Keep it running with launchd

Create `~/Library/LaunchAgents/com.groway.merchant-os.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.groway.merchant-os</string>
  <key>WorkingDirectory</key>
  <string>/Users/YOUR_USERNAME/Projects/groway-merchant-os</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/bun</string>
    <string>run</string>
    <string>start</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/groway-merchant-os.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/groway-merchant-os.error.log</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.groway.merchant-os.plist
launchctl start com.groway.merchant-os
```

---

## 10. Remote Access via Cloudflare Tunnel (Optional)

If you want to access the app from outside your Mac (e.g., from your phone or
share a demo link):

```bash
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create groway-staging
cloudflared tunnel route dns groway-staging staging.yourdomain.com
```

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id-from-create>
credentials-file: /Users/YOUR_USERNAME/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: staging.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

```bash
cloudflared tunnel run groway-staging
```

Then update `.env`:
```env
NEXT_PUBLIC_BASE_URL=https://staging.yourdomain.com
```

Lock it down with Cloudflare Access (zero-trust) so only your email can reach it:
```bash
# In the Cloudflare dashboard → Zero Trust → Access → Applications
# Add an application for staging.yourdomain.com
# Require email: your-email@gmail.com
```

---

## 11. Backups

### SQLite (automatic)

The `dev.db` file is your entire database. Back it up:

```bash
# Add to crontab (crontab -e):
0 2 * * * cp ~/Projects/groway-merchant-os/dev.db ~/backups/groway-$(date +\%Y\%m\%d).db
0 3 * * * find ~/backups -name "groway-*.db" -mtime +30 -delete
```

### PostgreSQL

```bash
# Add to crontab:
0 2 * * * pg_dump groway | gzip > ~/backups/groway-$(date +\%Y\%m\%d).sql.gz
0 3 * * * find ~/backups -name "groway-*.sql.gz" -mtime +30 -delete
```

Test a restore monthly:
```bash
createdb groway-test
gunzip -c ~/backups/groway-20260101.sql.gz | psql groway-test
psql groway-test -c "SELECT COUNT(*) FROM Merchant;"
```

---

## 12. Common Issues

### Port 3000 already in use

```bash
lsof -i :3000
kill -9 <pid>
```

### Prisma client out of sync

```bash
bun run db:generate
```

### Schema changed after pulling updates

```bash
bun run db:push     # dev — applies schema changes without data loss warnings
bun run db:migrate  # prod — creates migration files
```

### Turbopack crashes (corrupted .next cache)

```bash
rm -rf .next
bun run dev
```

### Database file locked

```bash
# Kill any stale processes holding the DB
pkill -f "bun run dev"
pkill -f "next-server"
rm -f dev.db-journal
bun run dev
```

### Memory pressure (rare on 16 GB Mac)

```bash
# Limit Node's heap
NODE_OPTIONS="--max-old-space-size=2048" bun run dev
```

---

## 13. Updating the Codebase

When you pull new code:

```bash
git pull origin main
bun install          # if package.json changed
bun run db:push      # if schema changed
bun run db:generate  # regenerate Prisma client
bun run dev
```

---

## 14. Moving to PostgreSQL

Per the Tshepo spec, SQLite is fine for development and staging. Move to
PostgreSQL before going live with real customer money.

### Steps

1. Install Postgres (see section 1)
2. Create the database: `createdb groway`
3. Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Update `.env`:
   ```env
   DATABASE_URL="postgresql://$(whoami)@localhost:5432/groway?schema=public"
   ```
5. Push the schema: `bun run db:push`
6. Re-seed: `bun run scripts/comprehensive-seed.ts`

### Migrating existing SQLite data to Postgres (optional)

```bash
# Export from SQLite
sqlite3 dev.db .dump > data.sql

# Transform and import to Postgres (requires manual type fixes)
# Prisma prefers you re-seed rather than migrate test data.
bun run scripts/comprehensive-seed.ts
```

---

## Quick Reference Card

| Command | What it does |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server (port 3000) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Apply schema to DB |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:studio` | Open Prisma Studio (DB GUI) |
| `bun run scripts/comprehensive-seed.ts` | Seed demo data |

| URL | What |
|-----|------|
| `http://localhost:3000/` | Homepage (GroCore enlisted) |
| `http://localhost:3000/grocore` | GroCore landing page |
| `http://localhost:3000/grocore/login` | GroCore login |
| `http://localhost:3000/grocore/app` | GroCore dashboard (9 views) |
| `http://localhost:3000/merchant-os/login` | Merchant OS login |
| `http://localhost:3000/merchant-os/app` | Merchant OS dashboard |
| `http://localhost:3000/admin-console/login` | Admin console |

---

*That's it. If you hit any issue, check section 12 (Common Issues) or read
`dev.log` for the error message.*
