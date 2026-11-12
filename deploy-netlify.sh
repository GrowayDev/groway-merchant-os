#!/bin/bash

# ============================================
# Groway Netlify Deployment Script
# ============================================

echo "🚀 Preparing Groway for Netlify deployment..."

# Step 1: Install dependencies
echo "📥 Installing dependencies..."
bun install

# Step 2: Generate Prisma client
echo "⚙️ Generating Prisma client..."
bunx prisma generate

# Step 3: Build the project
echo "🔨 Building project..."
NODE_ENV=production NETLIFY=true bun run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ============================================"
    echo "✅ Build Complete!"
    echo "✅ ============================================"
    echo ""
    echo "📁 Output folder: ./.next"
    echo ""
    echo "To deploy to Netlify:"
    echo "1. Connect your GitHub repo to Netlify"
    echo "2. Or use: netlify deploy --prod"
    echo ""
else
    echo ""
    echo "❌ Build failed. Check the errors above."
    exit 1
fi
