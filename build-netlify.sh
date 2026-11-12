#!/bin/bash

# ============================================
# Groway Netlify Deployment Script
# ============================================
# This script prepares the project for Netlify deployment
# Run this before uploading to Netlify

echo "🚀 Preparing Groway for Netlify deployment..."

# Step 1: Backup original config
echo "📦 Step 1: Backing up original configuration..."
if [ -f "next.config.ts" ]; then
  cp next.config.ts next.config.ts.backup
  echo "   ✓ Backed up next.config.ts"
fi

# Step 2: Use Netlify-specific config
echo "⚙️  Step 2: Applying Netlify configuration..."
cp next.config.netlify.ts next.config.ts
echo "   ✓ Applied static export configuration"

# Step 3: Install dependencies
echo "📥 Step 3: Installing dependencies..."
bun install
echo "   ✓ Dependencies installed"

# Step 4: Build for static export
echo "🔨 Step 4: Building for static export..."
bun run build
echo "   ✓ Build complete"

# Step 5: Create _redirects file for SPA routing
echo "🔀 Step 5: Creating Netlify redirects..."
echo "/*    /index.html   200" > out/_redirects
echo "   ✓ Redirects configured"

# Step 6: Copy static assets
echo "📋 Step 6: Copying static assets..."
if [ -d "public" ]; then
  cp -r public/* out/ 2>/dev/null || true
fi
echo "   ✓ Static assets copied"

# Step 7: Create netlify.toml in output
echo "📝 Step 7: Creating netlify.toml..."
if [ -f "netlify.toml" ]; then
  cp netlify.toml out/
fi
echo "   ✓ netlify.toml ready"

# Restore original config
echo "🔄 Restoring original configuration..."
if [ -f "next.config.ts.backup" ]; then
  mv next.config.ts.backup next.config.ts
  echo "   ✓ Original config restored"
fi

echo ""
echo "✅ ============================================"
echo "✅ Build Complete!"
echo "✅ ============================================"
echo ""
echo "📁 Output folder: ./out"
echo ""
echo "Next steps:"
echo "1. Create a ZIP of the 'out' folder"
echo "2. Go to https://app.netlify.com/drop"
echo "3. Drag and drop the ZIP file"
echo ""
echo "OR deploy via Netlify CLI:"
echo "  cd out && netlify deploy --prod"
echo ""
