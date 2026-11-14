#!/bin/bash
cd /home/z/my-project
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_ENV=production
export JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 16)}"
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Check if production build exists
if [ -f ".next/BUILD_ID" ]; then
  echo "[DEV] Production build found, starting production server..."
  exec bun run start
else
  echo "[DEV] No production build, starting dev server..."
  exec bun run dev
fi
