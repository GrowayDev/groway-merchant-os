#!/bin/bash

# Groway Netlify Deployment Package Creator
# This script creates a deployable zip file for Netlify

set -e

echo "🚀 Creating Netlify deployment package..."

# Define output file
OUTPUT_FILE="public/groway-netlify-deploy.zip"
TEMP_DIR=$(mktemp -d)

echo "📦 Copying files to temporary directory..."

# Copy necessary files
mkdir -p "$TEMP_DIR/groway-netlify-deploy"

# Copy core config files
cp package.json "$TEMP_DIR/groway-netlify-deploy/"
cp bun.lock "$TEMP_DIR/groway-netlify-deploy/" 2>/dev/null || cp package-lock.json "$TEMP_DIR/groway-netlify-deploy/" 2>/dev/null || true
cp netlify.toml "$TEMP_DIR/groway-netlify-deploy/"
cp next.config.ts "$TEMP_DIR/groway-netlify-deploy/"
cp tsconfig.json "$TEMP_DIR/groway-netlify-deploy/"
cp tailwind.config.ts "$TEMP_DIR/groway-netlify-deploy/"
cp postcss.config.mjs "$TEMP_DIR/groway-netlify-deploy/"
cp components.json "$TEMP_DIR/groway-netlify-deploy/"
cp next-env.d.ts "$TEMP_DIR/groway-netlify-deploy/"

# Copy prisma schema and database
cp -r prisma "$TEMP_DIR/groway-netlify-deploy/"
cp dev.db "$TEMP_DIR/groway-netlify-deploy/" 2>/dev/null || echo "No dev.db found, skipping..."

# Copy source directories
cp -r src "$TEMP_DIR/groway-netlify-deploy/"
cp -r public "$TEMP_DIR/groway-netlify-deploy/"
cp -r skills "$TEMP_DIR/groway-netlify-deploy/" 2>/dev/null || echo "No skills dir, skipping..."

# Copy scripts directory
cp -r scripts "$TEMP_DIR/groway-netlify-deploy/" 2>/dev/null || echo "No scripts dir, skipping..."

# Copy lib directory if it exists at root level
cp -r lib "$TEMP_DIR/groway-netlify-deploy/" 2>/dev/null || echo "No lib dir at root, skipping..."

# Copy mini-services if needed
cp -r mini-services "$TEMP_DIR/groway-netlify-deploy/" 2>/dev/null || echo "No mini-services dir, skipping..."

# Copy any other config files that might be needed
cp .env.example "$TEMP_DIR/groway-netlify-deploy/" 2>/dev/null || echo "No .env.example, skipping..."
cp README.md "$TEMP_DIR/groway-netlify-deploy/" 2>/dev/null || echo "No README.md, skipping..."

# Create a proper .env for Netlify (with placeholder values)
cat > "$TEMP_DIR/groway-netlify-deploy/.env.example" << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# Add your environment variables here
# For production, set these in Netlify dashboard
EOF

# Remove node_modules and .next if they were copied
rm -rf "$TEMP_DIR/groway-netlify-deploy/node_modules"
rm -rf "$TEMP_DIR/groway-netlify-deploy/.next"
rm -rf "$TEMP_DIR/groway-netlify-deploy/public/node_modules"

echo "📦 Creating zip file..."

# Create zip file
cd "$TEMP_DIR"
zip -r "$OUTPUT_FILE" groway-netlify-deploy -x "*.DS_Store" -x "__MACOSX/*"

# Cleanup
rm -rf "$TEMP_DIR"

# Get file size
SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo "✅ Netlify deployment package created!"
echo "📁 Location: $OUTPUT_FILE"
echo "📊 Size: $SIZE"
echo ""
echo "🚀 To deploy on Netlify:"
echo "   1. Download the zip file"
echo "   2. Extract it"
echo "   3. Drag the extracted folder to Netlify"
