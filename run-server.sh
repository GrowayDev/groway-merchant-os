#!/bin/bash
cd /home/z/my-project
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_ENV=production
export JWT_SECRET="prod-$(openssl rand -base64 16)"
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"

while true; do
  echo "[$(date)] Starting next-server..."
  bun run start >> /home/z/my-project/server.log 2>&1
  echo "[$(date)] Server exited (code $?), restarting in 2s..."
  sleep 2
done
