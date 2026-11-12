#!/bin/bash
cd /home/z/my-project
while true; do
  if ! pgrep -f "next dev" > /dev/null; then
    echo "Starting dev server..."
    node node_modules/.bin/next dev -p 3000 &
    sleep 5
  fi
  sleep 10
done
