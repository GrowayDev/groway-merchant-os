#!/bin/bash
cd /home/z/my-project
while true; do
  rm -rf .next/cache .next/dev 2>/dev/null
  NODE_OPTIONS="--max-old-space-size=2048" node ./node_modules/.bin/next dev -p 3000 --webpack
  sleep 8
done
