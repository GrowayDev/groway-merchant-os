# Groway Superapp - Netlify Deployment Guide

## Quick Start

This guide will help you deploy the Groway Superapp to Netlify in 15 minutes.

---

## Prerequisites

1. **Netlify Account** - [Sign up free](https://app.netlify.com/signup)
2. **GitHub Account** - For repository hosting
3. **Neon Account** (Recommended) - [Sign up free](https://neon.tech) for PostgreSQL database
4. **Node.js 20+** - For local testing

---

## Step 1: Set Up Database (Neon - Recommended)

### Option A: Neon (Free PostgreSQL - Recommended)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project called "groway"
3. Copy the connection string:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/groway?sslmode=require
   ```
4. Save this as your `DATABASE_URL`

### Option B: Supabase (Free PostgreSQL)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Project Settings > Database > Connection string
4. Copy the connection string

### Option C: PlanetScale (Free MySQL)

1. Go to [planetscale.com](https://planetscale.com) and sign up
2. Create a new database
3. Get connection details from the dashboard

---

## Step 2: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial Groway Superapp commit"

# Create GitHub repository and push
# Option 1: Using GitHub CLI
gh repo create groway-superapp --public --source=. --push

# Option 2: Manual
# Create repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/groway-superapp.git
git push -u origin main
```

---

## Step 3: Deploy to Netlify

### Method A: Netlify UI (Easiest)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect your GitHub account
4. Select your `groway-superapp` repository
5. Configure build settings:
   - **Build command**: `npm run build:netlify`
   - **Publish directory**: `.next`
6. Click "Deploy site"

### Method B: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

---

## Step 4: Configure Environment Variables

In Netlify Dashboard, go to Site Settings > Environment Variables and add:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `NEXTAUTH_SECRET` | Random secret for auth | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Netlify URL | `https://groway.netlify.app` |
| `NEXT_PUBLIC_APP_URL` | Your Netlify URL | `https://groway.netlify.app` |

### Optional Variables (For Full Functionality)

| Variable | Description |
|----------|-------------|
| `Z_AI_API_KEY` | AI services API key |
| `PAYSHAP_MERCHANT_ID` | PayShap integration |
| `PAYSHAP_API_KEY` | PayShap API key |
| `CARD_PROCESSOR_PUBLIC_KEY` | Card processing |
| `CARD_PROCESSOR_SECRET_KEY` | Card processing secret |
| `REMITTANCE_API_KEY` | Remittance services |
| `FLIGHT_API_KEY` | Flight booking |
| `TWILIO_ACCOUNT_SID` | SMS notifications |
| `TWILIO_AUTH_TOKEN` | SMS auth |
| `SMTP_HOST` | Email sending |

---

## Step 5: Run Database Migrations

After first deploy, run migrations:

### Via Netlify CLI

```bash
netlify run prisma migrate deploy
```

### Via Netlify Dashboard

Add a build hook or use the CLI:
```bash
netlify run npx prisma db push
```

---

## Post-Deployment Checklist

- [ ] Site loads at Netlify URL
- [ ] Database connection works
- [ ] Landing page displays correctly
- [ ] Consumer Wallet app loads (`/consumer-wallet`)
- [ ] Merchant OS app loads (`/merchant-os/app`)
- [ ] API routes respond (`/api/health`)
- [ ] Environment variables are set
- [ ] Custom domain configured (optional)

---

## Custom Domain Setup

1. Go to Site Settings > Domain Management
2. Add custom domain (e.g., `groway.co.za`)
3. Configure DNS records as instructed
4. Enable HTTPS (automatic with Netlify)

---

## Continuous Deployment

Netlify automatically deploys when you push to GitHub:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests create preview URLs

---

## Troubleshooting

### Build Fails

1. Check build logs in Netlify dashboard
2. Verify `DATABASE_URL` is correct
3. Ensure Node.js version is 20+

### Database Connection Error

1. Verify `DATABASE_URL` format
2. Check if database allows external connections
3. Ensure SSL mode is correct for your provider

### API Routes Not Working

1. Check Netlify functions logs
2. Verify API routes are in correct location
3. Check for CORS issues

### Environment Variables Not Loading

1. Redeploy after adding variables
2. Clear Netlify cache (Site Settings > Build > Clear cache)
3. Verify variable names match exactly

---

## Project Structure

```
groway-superapp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Landing page
│   │   ├── api/               # API routes
│   │   ├── consumer-wallet/   # Consumer Wallet app
│   │   ├── merchant-os/       # Merchant OS app
│   │   └── ...
│   ├── components/            # React components
│   └── lib/                   # Utilities
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── downloads/             # Downloadable files
├── netlify.toml               # Netlify config
├── next.config.ts             # Next.js config
└── package.json               # Dependencies
```

---

## Support

- **Documentation**: Check `GROWAY_MASTER_BUILD_DOCUMENT.docx`
- **Issues**: Create GitHub issue
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)

---

## Cost Estimate (Free Tier)

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Netlify | 100GB bandwidth | Custom domain included |
| Neon | 0.5GB storage | Serverless PostgreSQL |
| Supabase | 500MB database | Alternative to Neon |
| GitHub | Unlimited repos | Required for deployment |

**Total: $0/month** for development and small production use.

---

## Scaling

When you outgrow free tiers:

| Users | Recommended Plan | Est. Cost |
|-------|------------------|-----------|
| < 10K | Free tiers | $0/mo |
| 10K-100K | Netlify Pro + Neon Pro | ~$40/mo |
| 100K+ | Netlify Business + Neon Scale | ~$200/mo |

---

## Next Steps

1. Configure payment gateways (PayShap, card processing)
2. Set up SMS provider (Twilio)
3. Add email service (Resend/SendGrid)
4. Configure AI services (z-ai-web-dev-sdk)
5. Set up monitoring (Sentry)
6. Add analytics (Google Analytics)

---

**Happy Deploying! 🚀**
