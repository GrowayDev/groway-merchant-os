#!/bin/bash
# Script to seed data on startup to prevent data loss

echo "🔄 Running startup seed scripts..."

# Seed suppliers (350 including wholesalers)
echo "📦 Seeding suppliers..."
bun run scripts/seed-suppliers.ts

# Seed catalog (400 products)
echo "📦 Seeding catalog..."
bun run scripts/seed-catalog.ts

echo "✅ Startup seeding complete!"
