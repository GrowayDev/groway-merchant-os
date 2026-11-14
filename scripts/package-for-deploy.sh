#!/bin/bash
# =============================================================================
# Groway Merchant OS — Source Code Packager
# Creates a clean, deployment-ready tarball of the source code.
# Run this on your development machine to create a transfer file for Oracle Cloud.
#
# Usage:
#   bash scripts/package-for-deploy.sh
#
# Output:
#   groway-source.tar.gz  (typically 5–20 MB, excluding node_modules/.next)
# =============================================================================

set -e
cd "$(dirname "$0")/.."

OUTPUT="groway-source.tar.gz"
echo "📦 Packaging Groway Merchant OS source code for deployment..."

# Verify we're in the right place
if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
  echo "❌ Error: Run this from the project root (must contain package.json + Dockerfile)"
  exit 1
fi

# Create the tarball, excluding everything that shouldn't be transferred
tar -czf "$OUTPUT" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='skills' \
  --exclude='mini-services' \
  --exclude='dev.db' \
  --exclude='dev.db-journal' \
  --exclude='db/*.db' \
  --exclude='db/*.db-journal' \
  --exclude='*.log' \
  --exclude='video-assets' \
  --exclude='verify' \
  --exclude='groway-demo.mp4' \
  --exclude='groway-source.tar.gz' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='public/zi*' \
  --exclude='scripts/check-pharm.ts' \
  --exclude='scripts/debug-nav.ts' \
  --exclude='scripts/capture-*.ts' \
  --exclude='scripts/gen-tts.ts' \
  --exclude='research-counterfeit-crisis.md' \
  --exclude='video-script.md' \
  --exclude='worklog.md' \
  --exclude='tmp' \
  --exclude='*.tmp' \
  -C . . 2>/dev/null || true

SIZE=$(du -h "$OUTPUT" | cut -f1)
echo ""
echo "✅ Package created: $OUTPUT ($SIZE)"
echo ""
echo "📋 Transfer to your Oracle server:"
echo "   scp -i ~/.ssh/groway-oracle $OUTPUT ubuntu@<SERVER_IP>:~/"
echo ""
echo "📋 Then on the server:"
echo "   mkdir -p ~/groway && cd ~/groway"
echo "   tar -xzf ~/$OUTPUT"
echo "   rm ~/$OUTPUT"
echo "   cp .env.production.example .env"
echo "   nano .env  # fill in your domain + JWT_SECRET"
echo "   docker compose up -d --build"
echo ""
echo "📖 Full guide: DEPLOY-ORACLE.md"
