#!/bin/bash
cd /home/z/my-project
export JWT_SECRET="prod-runtime-secret-$(openssl rand -base64 16)"
export NODE_ENV=production
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"
export NEXT_PUBLIC_BASE_URL="http://localhost:3000"
exec bun run start
