#!/bin/bash
# dev-keeper.sh v7 — self-healing dev server keeper for Groway Merchant OS
# Survives session teardown via setsid. Revives next dev on:
#  - process death (port 3000 unresponsive)
#  - Turbopack cache corruption (panic detection -> wipe .next)
cd /home/z/my-project
LOG=dev-keeper.log
echo "[$(date '+%F %T')] keeper v7 started (pid $$)" >> $LOG

consecutive_failures=0

while true; do
  sleep 15
  if curl -s -o /dev/null --max-time 12 http://localhost:3000/; then
    consecutive_failures=0
    continue
  fi

  consecutive_failures=$((consecutive_failures+1))
  echo "[$(date '+%F %T')] health check failed ($consecutive_failures)" >> $LOG

  if [ "$consecutive_failures" -lt 2 ]; then
    continue  # transient — maybe mid-compile
  fi

  echo "[$(date '+%F %T')] dev server DOWN — reviving" >> $LOG
  consecutive_failures=0

  # kill stale dev processes
  pkill -f "next dev" 2>/dev/null
  pkill -f "next-server" 2>/dev/null
  sleep 3
  pkill -9 -f "next dev" 2>/dev/null
  pkill -9 -f "next-server" 2>/dev/null
  sleep 2

  # Turbopack corruption detection -> wipe cache
  if tail -80 dev.log 2>/dev/null | grep -qE "corrupted database|panicked at|FATAL"; then
    echo "[$(date '+%F %T')] Turbopack corruption detected — wiping .next cache" >> $LOG
    rm -rf .next
  fi

  echo "[$(date '+%F %T')] spawning dev server" >> $LOG
  setsid nohup bash -c 'cd /home/z/my-project && exec bun run dev >> /home/z/my-project/dev-server.log 2>&1' < /dev/null >> /dev/null 2>&1 &
  sleep 45
done
