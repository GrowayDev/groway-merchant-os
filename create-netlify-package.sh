#!/bin/bash

# Create a temporary directory for the package
PKG_DIR="/tmp/groway-netlify-deploy"
rm -rf "$PKG_DIR"
mkdir -p "$PKG_DIR"

echo "Creating Netlify deployment package..."

# Copy essential source files
echo "Copying source files..."
cp -r src "$PKG_DIR/"

# Copy prisma folder with ALL data files
echo "Copying prisma schema and data files..."
mkdir -p "$PKG_DIR/prisma"
cp prisma/schema.prisma "$PKG_DIR/prisma/"
cp -r prisma/seed*.ts "$PKG_DIR/prisma/" 2>/dev/null || true
cp prisma/suppliers-from-excel.json "$PKG_DIR/prisma/" 2>/dev/null || true
cp prisma/*.json "$PKG_DIR/prisma/" 2>/dev/null || true

# Copy scripts folder with seed data scripts
echo "Copying scripts and seed data..."
mkdir -p "$PKG_DIR/scripts"
cp scripts/seed*.ts "$PKG_DIR/scripts/" 2>/dev/null || true
cp scripts/seed*.py "$PKG_DIR/scripts/" 2>/dev/null || true
cp scripts/import*.ts "$PKG_DIR/scripts/" 2>/dev/null || true
cp scripts/*catalog*.ts "$PKG_DIR/scripts/" 2>/dev/null || true
cp scripts/*supplier*.ts "$PKG_DIR/scripts/" 2>/dev/null || true
cp scripts/*wholesaler*.ts "$PKG_DIR/scripts/" 2>/dev/null || true

# Copy public assets
echo "Copying public assets..."
cp -r public "$PKG_DIR/"

# Copy configuration files
echo "Copying configuration files..."
cp package.json "$PKG_DIR/"
cp package-lock.json "$PKG_DIR/" 2>/dev/null || true
cp bun.lock "$PKG_DIR/" 2>/dev/null || true
cp next.config.ts "$PKG_DIR/"
cp tailwind.config.ts "$PKG_DIR/"
cp postcss.config.mjs "$PKG_DIR/"
cp tsconfig.json "$PKG_DIR/"
cp components.json "$PKG_DIR/"
cp netlify.toml "$PKG_DIR/"
cp next.env.d.ts "$PKG_DIR/" 2>/dev/null || true
cp eslint.config.mjs "$PKG_DIR/" 2>/dev/null || true

# Create a README for the package
cat > "$PKG_DIR/README.md" << 'README'
# Groway Superapp - Netlify Deployment Package

## Quick Deploy to Netlify

### Option 1: Drag & Drop
1. Go to [app.netlify.com](https://app.netlify.com)
2. Sign in or create a free account
3. Click "Add new site" → "Deploy manually"
4. Drag this entire folder to the deploy zone
5. Wait for build to complete (2-3 minutes)
6. Your site will be live! 🎉

### Option 2: GitHub Integration
1. Push this folder to a GitHub repository
2. Connect the repo to Netlify
3. Netlify will auto-deploy on push

## Build Settings (Auto-configured)
- Build command: `npm run build:netlify`
- Publish directory: `.next`
- Node version: 20

## Environment Variables (Optional)
Set these in Netlify's Site Settings → Environment Variables:

```
DATABASE_URL=your-database-url
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-site.netlify.app
```

## Platform Features
- 🏪 12 Business Verticals
- 📱 Consumer Wallet
- 💼 Merchant OS
- 🚚 GroSupply B2B Marketplace
- 💬 GroSell WhatsApp Commerce
- 💳 GoPay Payment Gateway
- 🏢 Enterprise Portal
- 👥 Agent Network

## Support
- Website: groway.co.za
- Email: info@groway.co.za

---
Built with ❤️ by Groway
README

# Remove unnecessary files
rm -rf "$PKG_DIR/src/app/consumer-wallet-app-page.tsx.backup"
rm -rf "$PKG_DIR/src/app/consumer-wallet/page.tsx.*.backup"
rm -rf "$PKG_DIR/src/app/page.tsx.backup"
rm -rf "$PKG_DIR/src/app/download" 2>/dev/null || true

# Create the zip file
echo "Creating zip archive..."
cd /tmp
rm -f groway-netlify-deploy.zip
zip -rq groway-netlify-deploy.zip groway-netlify-deploy

# Move to public folder
mv groway-netlify-deploy.zip /home/z/my-project/public/

# Calculate size
SIZE=$(du -h /home/z/my-project/public/groway-netlify-deploy.zip | cut -f1)
echo "Package created: groway-netlify-deploy.zip ($SIZE)"

# Cleanup
rm -rf "$PKG_DIR"

echo "Done!"
