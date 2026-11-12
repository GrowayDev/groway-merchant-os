#!/bin/bash

# ============================================
# Groway Demo Package Creator
# ============================================
# Creates a ZIP file ready for Netlify deployment
# Run this script to create a shareable demo package

set -e

PACKAGE_NAME="groway-demo-$(date +%Y%m%d-%H%M%S)"
OUTPUT_DIR="./deploy-output"
ZIP_FILE="${PACKAGE_NAME}.zip"

echo "╔════════════════════════════════════════════╗"
echo "║   Groway Demo Package Creator              ║"
echo "║   Creating Netlify-ready deployment        ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Step 1: Prepare output directory
echo "📁 Step 1: Preparing output directory..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/public"
mkdir -p "$OUTPUT_DIR/src/app"
mkdir -p "$OUTPUT_DIR/prisma"
echo "   ✓ Output directory created"

# Step 2: Copy essential configuration files
echo "📋 Step 2: Copying configuration files..."
cp package.json "$OUTPUT_DIR/"
cp next.config.static.ts "$OUTPUT_DIR/next.config.ts"
cp netlify.toml "$OUTPUT_DIR/"
cp tsconfig.json "$OUTPUT_DIR/" 2>/dev/null || true
cp tailwind.config.ts "$OUTPUT_DIR/" 2>/dev/null || true
cp postcss.config.mjs "$OUTPUT_DIR/" 2>/dev/null || true
echo "   ✓ Configuration files copied"

# Step 3: Copy public assets
echo "🖼️  Step 3: Copying public assets..."
cp -r public/* "$OUTPUT_DIR/public/" 2>/dev/null || true
echo "   ✓ Public assets copied"

# Step 4: Copy Prisma schema (for build)
echo "🗄️  Step 4: Copying Prisma schema..."
cp -r prisma/* "$OUTPUT_DIR/prisma/" 2>/dev/null || true
echo "   ✓ Prisma schema copied"

# Step 5: Copy source code - essential files only
echo "📝 Step 5: Copying source code..."

# Copy components
cp -r src/components "$OUTPUT_DIR/src/" 2>/dev/null || true

# Copy lib folder
cp -r src/lib "$OUTPUT_DIR/src/" 2>/dev/null || true

# Copy hooks folder
cp -r src/hooks "$OUTPUT_DIR/src/" 2>/dev/null || true

# Copy app directory (landing pages and demo)
# Exclude API routes and full app pages with database dependencies
mkdir -p "$OUTPUT_DIR/src/app"

# Copy main landing page
cp src/app/page.tsx "$OUTPUT_DIR/src/app/"
cp src/app/layout.tsx "$OUTPUT_DIR/src/app/"
cp src/app/globals.css "$OUTPUT_DIR/src/app/"

# Copy product demo page
mkdir -p "$OUTPUT_DIR/src/app/product-demo"
cp src/app/product-demo/page.tsx "$OUTPUT_DIR/src/app/product-demo/" 2>/dev/null || true

# Copy individual landing pages (not full apps)
for dir in merchant-os consumer-wallet grosupply grocredit gopay admin-console agent-network enterprise download landing; do
  if [ -d "src/app/$dir" ]; then
    # Only copy landing pages, not full apps
    if [ -f "src/app/$dir/page.tsx" ]; then
      mkdir -p "$OUTPUT_DIR/src/app/$dir"
      cp src/app/$dir/page.tsx "$OUTPUT_DIR/src/app/$dir/"
    fi
  fi
done

echo "   ✓ Source code copied"

# Step 6: Create minimal API routes for static compatibility
echo "⚡ Step 6: Creating fallback API routes..."
mkdir -p "$OUTPUT_DIR/src/app/api/contact"
cat > "$OUTPUT_DIR/src/app/api/contact/route.ts" << 'EOF'
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ success: true, message: 'Demo mode - message received' })
}
EOF
echo "   ✓ Fallback API routes created"

# Step 7: Create README for the package
echo "📄 Step 7: Creating deployment README..."
cat > "$OUTPUT_DIR/README.md" << 'EOF'
# Groway Demo - Netlify Deployment Package

## Quick Deploy

### Option 1: Netlify Drop (Easiest)
1. Go to https://app.netlify.com/drop
2. Drag and drop this entire folder
3. Done!

### Option 2: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Option 3: GitHub Integration
1. Push this folder to a GitHub repository
2. Connect to Netlify: https://app.netlify.com
3. Build command: `npm run build`
4. Publish directory: `out`

## Build Commands
```bash
npm install
npm run build
```

## What's Included
- Main landing page (/)
- Product demo page (/product-demo/)
- Individual app landing pages

## Contact
- Email: bridge@groway.co.za
- Phone: +27 817184013
- Website: www.groway.co.za
EOF
echo "   ✓ README created"

# Step 8: Create ZIP archive
echo "📦 Step 8: Creating ZIP archive..."
cd "$OUTPUT_DIR"
zip -r "../$ZIP_FILE" . -x "*.DS_Store" -x "__MACOSX/*"
cd ..
echo "   ✓ ZIP archive created: $ZIP_FILE"

# Cleanup
echo "🧹 Cleaning up..."
rm -rf "$OUTPUT_DIR"

# Summary
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║            ✅ PACKAGE CREATED!             ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📦 File: $ZIP_FILE"
echo "📊 Size: $(du -h "$ZIP_FILE" | cut -f1)"
echo ""
echo "🚀 Deploy Options:"
echo "   1. Netlify Drop: https://app.netlify.com/drop"
echo "   2. Upload to GitHub → Connect to Netlify"
echo ""
echo "📞 Support: bridge@groway.co.za | +27 817184013"
echo ""
