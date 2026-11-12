#!/bin/bash

# Create deployment package for Netlify
echo "Creating Netlify deployment package..."

# Define output file
OUTPUT_FILE="public/groway-netlify-deploy.zip"

# Remove old package if exists
rm -f "$OUTPUT_FILE"

# Create exclusion file
cat > /tmp/exclude.txt << 'EXCLUDE'
node_modules
.next
.git
*.log
*.db-journal
.env.local
.env.development.local
.env.test.local
.env.production.local
public/groway-netlify-deploy.zip
scripts/create-deploy-package.sh
.tmp
EXCLUDE

# Create the zip file
zip -r "$OUTPUT_FILE" . \
  -x@/tmp/exclude.txt \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*" \
  -x "*.log" \
  -x "*.db-journal" \
  -x "public/groway-netlify-deploy.zip"

# Get file size
SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo ""
echo "Deployment package created: $OUTPUT_FILE ($SIZE)"
echo ""
echo "Package includes:"
echo "  - All source code"
echo "  - Database with seeded data (dev.db)"
echo "  - Prisma schema and migrations"
echo "  - Environment configuration"
echo "  - Netlify configuration"
