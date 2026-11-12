# Netlify Deployment Guide for Groway Platform

## Option 1: Download and Deploy Manually

### Step 1: Download the Full Project
Click the "Download Full Project" button on the landing page to get `groway_full_project_20260316.tar.gz` (~30 MB)

### Step 2: Extract and Prepare
```bash
# Extract the archive
tar -xzf groway_full_project_20260316.tar.gz

# Navigate to the project
cd groway-project

# Install dependencies
bun install
# OR if you don't have bun
npm install
```

### Step 3: Database Setup (IMPORTANT)
The project uses SQLite which won't work on Netlify's serverless functions. You have two options:

#### Option A: Use an External Database
1. Create a free PostgreSQL database on:
   - [Neon](https://neon.tech) (Recommended - Free tier)
   - [Supabase](https://supabase.com) (Free tier)
   - [PlanetScale](https://planetscale.com) (Free tier)

2. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

3. Set the `DATABASE_URL` environment variable in Netlify

#### Option B: Use Static Export (No Database)
If you only need the frontend demo without database functionality:

1. Update `next.config.ts`:
```typescript
const nextConfig = {
  output: 'export',
  images: { unoptimized: true }
}
```

2. Run `bun run build` (creates `out/` folder)

3. Deploy the `out/` folder to Netlify as static files

### Step 4: Deploy to Netlify

#### Method A: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

#### Method B: GitHub Integration (Recommended)
1. Push the project to GitHub
2. Go to [Netlify Dashboard](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `bun run build` or `npm run build`
   - Publish directory: `.next`
6. Add environment variables (especially `DATABASE_URL`)
7. Deploy!

## Option 2: Use the Existing netlify.toml

The project already has a `netlify.toml` configured. Simply:

1. Connect your GitHub repo to Netlify
2. Set environment variables in Netlify Dashboard:
   - `DATABASE_URL` (if using PostgreSQL)
   - `NEXTAUTH_SECRET` (for authentication)
   - `NEXTAUTH_URL` (your Netlify URL)

## Important Notes

### SQLite Limitation
⚠️ SQLite databases are file-based and **will NOT work** on Netlify because:
- Serverless functions are ephemeral (files reset after each request)
- No persistent file system

**Solution:** Switch to PostgreSQL or use static export

### Environment Variables Required
```
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-site.netlify.app
```

### API Routes
All API routes in `/src/app/api/` will work as Netlify Functions automatically.

## Quick Start Checklist

- [ ] Download project from landing page
- [ ] Extract and install dependencies
- [ ] Set up external database (Neon/Supabase recommended)
- [ ] Update Prisma schema for PostgreSQL
- [ ] Push to GitHub
- [ ] Connect to Netlify
- [ ] Add environment variables
- [ ] Deploy!

## Need Help?

- [Netlify Docs](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/connect-your-database-typescript-postgresql)

---
**Project Stats:**
- Next.js 16 with App Router
- 8 Applications
- 12 Business Verticals
- 528+ API Endpoints
- 54+ Modals in Consumer Wallet
- South African Compliance (NCA, NCR, FSCA, POPIA)
