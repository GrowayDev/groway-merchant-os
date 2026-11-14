#!/bin/bash
# Groway Server Startup Script
# Starts Next.js production server with automatic restart on crash

cd /home/z/my-project

# Kill any existing processes on port 3000
lsof -ti :3000 2>/dev/null | xargs kill -9 2>/dev/null
pkill -f "next start" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 1

# Remove stale middleware.ts if it exists (conflicts with proxy.ts in Next.js 16)
rm -f src/middleware.ts

# Ensure production build exists
if [ ! -f ".next/BUILD_ID" ]; then
  echo "Building production..."
  node node_modules/.bin/next build
fi

# Start the server in a restart loop
echo "Starting Groway server on port 3000..."
while true; do
  node node_modules/.bin/next start -p 3000 2>&1
  EXIT_CODE=$?
  echo "[keepalive] Server exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done
