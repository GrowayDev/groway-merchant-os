# 🗄️ Neon Database Setup Guide for Groway

## What is Neon?

**Neon** is a serverless PostgreSQL database platform that offers:
- ✅ **Free tier** (0.5 GB storage, always free)
- ✅ **Auto-scaling** (scales to zero when not in use)
- ✅ **Branching** (create database branches like git)
- ✅ **Fast provisioning** (database ready in seconds)
- ✅ **Built-in connection pooling**
- ✅ **No credit card required** for free tier

---

## Step-by-Step Setup Process

### Step 1: Create Account

1. **Go to Neon**: https://neon.tech
2. **Click "Sign Up"** (top right corner)
3. **Choose sign-up method**:
   - Sign up with **GitHub** (recommended - faster)
   - Sign up with **Google**
   - Sign up with **Email**

![Sign Up Page](https://neon.tech/images/sign-up.png)

---

### Step 2: Create Your First Project

After signing up, you'll be prompted to create a project:

1. **Project Name**: Enter `groway`
2. **PostgreSQL Version**: Select `16` (or latest available)
3. **Region**: Choose closest to your users:
   - `US East (Ohio)` - for US East Coast
   - `US West (Oregon)` - for US West Coast
   - `EU (Frankfurt)` - for Europe
   - `Asia Pacific (Singapore)` - for Asia
   - `Asia Pacific (Sydney)` - for Australia

4. **Click "Create Project"**

⏱️ Takes about 5-10 seconds to provision

---

### Step 3: Get Your Connection Strings

After the project is created, you'll see a dashboard with your connection details:

#### Connection String (DATABASE_URL)
```
postgresql://groway_owner:AbCdEfGh123456@ep-cool-meadow-12345678.us-east-2.aws.neon.tech/groway?sslmode=require
```

#### Pooled Connection String (DIRECT_URL)
```
postgresql://groway_owner:AbCdEfGh123456@ep-cool-meadow-12345678.us-east-2.aws.neon.tech/groway?sslmode=require&pgbouncer=true
```

**📍 IMPORTANT**: Copy both strings! You'll need them for Netlify.

---

### Step 4: Where to Find Your Connection Strings Later

If you need to find your connection strings again:

1. Go to **Neon Dashboard**: https://console.neon.tech
2. Click on your project (`groway`)
3. Click **"Connection Details"** in the sidebar
4. You'll see:
   - **Connection string** (for DATABASE_URL)
   - **Pooled connection string** (for DIRECT_URL)

---

## Understanding the Connection String

```
postgresql://groway_owner:AbCdEfGh123456@ep-cool-meadow-12345678.us-east-2.aws.neon.tech/groway?sslmode=require
         │                 │                   │                              │          │
         │                 │                   │                              │          └── Database name
         │                 │                   │                              └── Host (endpoint)
         │                 │                   └── Password (keep this secret!)
         │                 └── Username
         └── Protocol
```

---

## Neon Dashboard Overview

### Main Sections

| Section | Purpose |
|---------|---------|
| **Dashboard** | Overview of usage, storage, connections |
| **Connection Details** | Get connection strings |
| **SQL Editor** | Run SQL queries directly |
| **Tables** | View and manage database tables |
| **Branches** | Create database branches |
| **Settings** | Project configuration |

---

## Neon Free Tier Limits

| Resource | Free Tier |
|----------|-----------|
| Storage | 0.5 GB |
| Compute | 191 hours/month |
| Databases | 1 project, 10 databases |
| Branches | 10 branches |
| Autosuspend | After 5 min inactivity |

**Note**: For production, consider upgrading to Pro ($19/month) for:
- 10 GB storage
- 300 compute hours
- No autosuspend
- Priority support

---

## Security Best Practices

### 1. Rotate Password Regularly

1. Go to **Settings** → **Reset Password**
2. Update your environment variables

### 2. Use Connection Pooling

For serverless (Netlify Functions), always use the **Pooled Connection String**:
- It's more efficient
- Handles multiple connections better
- Prevents connection exhaustion

### 3. Restrict Access

Neon automatically:
- Enforces SSL/TLS encryption
- Blocks non-encrypted connections
- Uses password authentication

---

## Troubleshooting

### Issue: "Connection timeout"

**Cause**: Neon free tier auto-suspends after 5 minutes of inactivity

**Solution**: First query may take 1-2 seconds to "wake up" the database. Subsequent queries will be fast.

### Issue: "Too many connections"

**Cause**: Using regular connection string in serverless

**Solution**: Use the **Pooled Connection String** (with `pgbouncer=true`)

### Issue: "SSL connection required"

**Cause**: Missing `sslmode=require` in connection string

**Solution**: Ensure your connection string includes:
```
?sslmode=require
```

### Issue: "Database not found"

**Cause**: Database name mismatch

**Solution**: Check the database name in your connection string matches Neon dashboard

---

## Next Steps

After setting up Neon:

1. **Add to Netlify Environment Variables**:
   - `DATABASE_URL` = Regular connection string
   - `DIRECT_URL` = Pooled connection string

2. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify Connection**:
   ```bash
   npx prisma studio
   ```

---

## Quick Reference

| Action | How To |
|--------|--------|
| View connection strings | Dashboard → Connection Details |
| Run SQL queries | Dashboard → SQL Editor |
| View tables | Dashboard → Tables |
| Create branch | Dashboard → Branches → New Branch |
| Check usage | Dashboard → Overview |
| Reset password | Settings → Reset Password |

---

## Support Links

- **Neon Documentation**: https://neon.tech/docs
- **Neon Status**: https://neonstatus.com
- **Neon Discord**: https://discord.gg/neon
- **Neon Twitter**: https://twitter.com/neon_database

---

## Need Help?

**Groway Support**:
- Email: bridge@groway.co.za
- Phone: +27 817184013
