# Groway Full System - Quick Deployment Guide

## 🚀 Deploy to Netlify with PostgreSQL Database

Follow these steps to deploy the **complete Groway platform** with database support.

---

## Step 1: Create PostgreSQL Database (FREE)

### Neon (Recommended)

1. Go to: **https://neon.tech**
2. Click **"Sign Up"** (use GitHub for easier login)
3. Create a new project:
   - Name: `groway`
   - Region: Choose closest to you
4. Copy the **Connection String** (looks like):
   ```
   postgresql://groway_owner:abc123@ep-cool-darkness-123456.us-east-2.aws.neon.tech/groway?sslmode=require
   ```
5. Also copy the **Pooled Connection** string

---

## Step 2: Deploy to Netlify

### Via GitHub (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to: **https://app.netlify.com**
   - Click **"Add new site"** → **"Import an existing project"**
   - Select **GitHub**
   - Choose your `groway` repository

3. **Configure Build Settings**
   | Setting | Value |
   |---------|-------|
   | Build command | `npm run build` |
   | Publish directory | `.next` |

4. **Add Environment Variables** (before deploying!)
   Click **"Show advanced"** → **"Add variable"**:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `DIRECT_URL` | Your Neon pooled connection string |
   | `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://your-site-name.netlify.app` |
   | `NEXT_PUBLIC_APP_URL` | `https://your-site-name.netlify.app` |
   | `NODE_VERSION` | `20` |

5. **Deploy**
   - Click **"Deploy site"**
   - Wait 5-10 minutes

---

## Step 3: Initialize Database

After deployment succeeds:

1. **Run locally with production database**
   ```bash
   # Create .env file with production DATABASE_URL
   DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
   ```

2. **Or use Prisma Studio to verify**
   ```bash
   DATABASE_URL="your-neon-connection-string" npx prisma studio
   ```

---

## Step 4: Verify Deployment

Visit your Netlify URL and check:

- [ ] Landing page loads (`/`)
- [ ] Product demo works (`/product-demo`)
- [ ] Merchant OS loads (`/merchant-os/app`)
- [ ] Consumer Wallet loads (`/consumer-wallet/app`)
- [ ] API routes work (`/api/contact`)

---

## 🔧 Environment Variables Checklist

Copy these to Netlify Dashboard → Site Settings → Environment Variables:

```bash
# REQUIRED - Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# REQUIRED - Authentication
NEXTAUTH_SECRET="random-32-character-string"
NEXTAUTH_URL="https://your-site.netlify.app"

# REQUIRED - Application
NEXT_PUBLIC_APP_URL="https://your-site.netlify.app"

# REQUIRED - Build
NODE_VERSION="20"
```

---

## 🆘 Common Issues & Fixes

### Build Fails

| Error | Fix |
|-------|-----|
| "Prisma Client could not be generated" | Add `postinstall: prisma generate` script |
| "Database connection failed" | Check DATABASE_URL format and SSL mode |
| "Module not found" | Run `npm install` before deploying |
| "NextAuth secret required" | Add NEXTAUTH_SECRET environment variable |

### Runtime Errors

| Error | Fix |
|-------|-----|
| 500 Internal Server Error | Check Netlify Functions logs |
| "Table does not exist" | Run `prisma migrate deploy` |
| Authentication fails | Verify NEXTAUTH_URL matches your domain |

---

## 📞 Support

- **Email**: bridge@groway.co.za
- **Phone**: +27 817184013
- **Website**: www.groway.co.za

---

## Quick Links

| Service | URL |
|---------|-----|
| Netlify Dashboard | https://app.netlify.com |
| Neon Database | https://console.neon.tech |
| Supabase | https://supabase.com/dashboard |
| GitHub | https://github.com |
