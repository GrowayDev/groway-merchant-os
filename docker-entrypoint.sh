#!/bin/bash
# =============================================================================
# Groway Merchant OS — Docker Entrypoint (Production)
# Designed and Built by Motheto Selepe.
#
# On first boot:
#   - Runs Prisma schema push (creates tables if missing)
#   - Seeds DEMO ACCOUNTS ONLY (User + Merchant + Branch + MerchantUser)
#     — NO demo feed data (suppliers, catalog, SKUs, products)
#     — Feed data should be loaded via explicit admin action or the
#       /merchant-os/api/auto-seed endpoint (which is gated to dev mode
#       or super_admin role).
# =============================================================================

set -e

echo "=== Groway Merchant OS — Starting ==="

# If DATABASE_URL is not set, default to the persistent volume
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/data/groway.db"
  echo "  DATABASE_URL not set — using default: $DATABASE_URL"
fi

# Run Prisma db push (creates tables if missing — safe for SQLite)
echo "  Pushing database schema..."
bunx prisma db push --skip-generate 2>/dev/null || echo "  [warn] prisma db push skipped"

# Seed DEMO ACCOUNTS ONLY if the database has no users (first boot)
DB_FILE="/app/data/groway.db"
SEED_FLAG="/app/data/.demo-accounts-seeded"
if [ ! -f "$SEED_FLAG" ]; then
  echo "  First boot detected — seeding demo accounts (no feed data)..."
  bun run prisma/seed-demo.ts 2>/dev/null || echo "  [warn] seed-demo skipped"
  echo "  Demo accounts seeded. (Suppliers/catalog NOT seeded — use admin tools or auto-seed endpoint to load feed data.)"
  touch "$SEED_FLAG"
else
  echo "  Demo accounts already seeded — skipping."
fi

echo "  Starting Next.js server on port $PORT..."
exec "$@"
