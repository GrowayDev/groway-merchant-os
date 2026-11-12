# Groway Full System Deployment Guide

## Complete Netlify Deployment with PostgreSQL Database

This guide covers deploying the **full Groway platform** with all features including database, API routes, and authentication.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up PostgreSQL Database](#step-1-set-up-postgresql-database)
3. [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
4. [Step 3: Deploy to Netlify](#step-3-deploy-to-netlify)
5. [Step 4: Initialize Database](#step-4-initialize-database)
6. [Step 5: Verify Deployment](#step-5-verify-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account (for code hosting)
- [ ] Netlify account (free tier works)
- [ ] Database account (Neon, Supabase, or Railway - all have free tiers)

---

## Step 1: Set Up PostgreSQL Database

### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and sign up (free tier)
2. Create a new project called "groway"
3. Copy your connection string:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/groway?sslmode=require
   ```
4. Also copy the connection pooling URL (for DIRECT_URL)

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (enable connection pooling)

### Option C: Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Create a new PostgreSQL database
3. Copy the connection URL

---

## Step 2: Configure Environment Variables

### 2.1 Copy the Template

Download or copy `.env.example` from the project.

### 2.2 Required Variables

Set these **required** variables in Netlify:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `DIRECT_URL` | Direct connection (for migrations) | `postgresql://...` |
| `NEXTAUTH_SECRET` | Random secret for auth | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Netlify URL | `https://groway.netlify.app` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://groway.netlify.app` |

### 2.3 Generate NEXTAUTH_SECRET

```bash
# On Mac/Linux
openssl rand -base64 32

# Or use this online tool
# https://generate-secret.vercel.app/32
```

---

## Step 3: Deploy to Netlify

### Method A: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push
   ```

2. **Connect to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select "GitHub"
   - Authorize Netlify to access your repositories
   - Select your `groway` repository

3. **Configure Build Settings**
   - Build command: `npm run build:netlify`
   - Publish directory: `.next`
   - Node version: 20 (add `NODE_VERSION=20` in environment variables)

4. **Add Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all required variables from Step 2

5. **Deploy**
   - Click "Deploy site"
   - Wait 5-10 minutes for first deployment

### Method B: Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Set environment variables
netlify env:import .env

# Deploy
netlify deploy --prod
```

---

## Step 4: Initialize Database

After the first deployment, initialize your database:

### Option A: Using Netlify CLI

```bash
# Install dependencies locally
npm install

# Set DATABASE_URL in your local .env
# Then run:
npx prisma migrate deploy
npx prisma db seed
```

### Option B: Using Prisma Studio

```bash
# Run locally with your production DATABASE_URL
DATABASE_URL="your-production-url" npx prisma studio
```

### Option C: Run Migrations on Netlify

Add a build hook or use Netlify Functions:

1. Create a migration script
2. Run via Netlify Functions or CLI

---

## Step 5: Verify Deployment

### Check the Following

1. **Landing Page**: Visit your Netlify URL
   - Should show Groway landing page

2. **Product Demo**: Visit `/product-demo`
   - Should show product portfolio

3. **API Health**: Visit `/api/health` (if exists)
   - Should return 200 OK

4. **Database**: Try creating data
   - Visit `/merchant-os/app` or `/consumer-wallet/app`
   - Try adding items

---

## Environment Variables Reference

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="https://your-site.netlify.app"

# Application
NEXT_PUBLIC_APP_URL="https://your-site.netlify.app"
```

### Optional Variables

```bash
# Payments (enable when needed)
PAYFAST_MERCHANT_ID="xxx"
PAYFAST_MERCHANT_KEY="xxx"
MTN_MOMO_API_KEY="xxx"

# Notifications
TWILIO_ACCOUNT_SID="xxx"
SMTP_HOST="smtp.example.com"

# AI Services
OPENAI_API_KEY="sk-xxx"
```

---

## Troubleshooting

### Build Fails

**Error: "Prisma Client could not be generated"**
```bash
# Ensure postinstall script runs
# In package.json:
"postinstall": "prisma generate"
```

**Error: "Database connection failed"**
- Check DATABASE_URL is correct
- Ensure SSL mode is enabled: `?sslmode=require`
- Check database is not paused (Neon free tier pauses after inactivity)

**Error: "NextAuth secret is required"**
- Add NEXTAUTH_SECRET to Netlify environment variables
- Regenerate if needed: `openssl rand -base64 32`

### Runtime Errors

**Error: "500 Internal Server Error"**
1. Check Netlify Functions logs
2. Verify DATABASE_URL is correct
3. Check all required environment variables are set

**Error: "Module not found"**
1. Clear cache and redeploy
2. Check package.json for missing dependencies

### Database Issues

**Error: "Table does not exist"**
```bash
# Run migrations
npx prisma migrate deploy
```

**Error: "Connection timeout"**
- Use connection pooling (DIRECT_URL)
- Check database provider status

---

## Post-Deployment Checklist

- [ ] Landing page loads correctly
- [ ] Product demo page works
- [ ] API routes respond
- [ ] Database connection works
- [ ] Authentication works (if enabled)
- [ ] All apps are accessible
- [ ] SSL is working (automatic on Netlify)
- [ ] Custom domain configured (optional)

---

## Useful Commands

```bash
# View Netlify logs
netlify functions:log

# Open Netlify admin
netlify open:admin

# Check deployment status
netlify status

# Run local development with Netlify
netlify dev
```

---

## Support

For deployment assistance:
- Email: bridge@groway.co.za
- Phone: +27 817184013
- Website: www.groway.co.za

---

## Quick Reference URLs

| Service | URL |
|---------|-----|
| Netlify Dashboard | https://app.netlify.com |
| Neon Database | https://console.neon.tech |
| Supabase | https://supabase.com/dashboard |
| Railway | https://railway.app/dashboard |
| GitHub | https://github.com |
