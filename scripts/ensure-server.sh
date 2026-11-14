#!/bin/bash
# Deterministic dev-server restore v3: kill-verify loop (no races), then ONE keeper.
cd /home/z/my-project

# Phase 1: stop all keepers first (they respawn servers behind our back)
pkill -9 -f "dev-keeper-v7" 2>/dev/null
sleep 1

# Phase 2: kill-verify loop — every server process AND the port must be free
for round in 1 2 3 4 5; do
  for pid in $(pgrep -f "next-server" 2>/dev/null); do kill -9 "$pid" 2>/dev/null; done
  for pid in $(pgrep -f "next dev -p 3000" 2>/dev/null); do kill -9 "$pid" 2>/dev/null; done
  sleep 2
  if ! pgrep -f "next-server" >/dev/null 2>&1 && ! ss -tln 2>/dev/null | grep -q ":3000 "; then
    break
  fi
done

if ss -tln 2>/dev/null | grep -q ":3000 "; then
  echo "FATAL: port 3000 still held after 5 kill rounds"
  exit 1
fi

# Phase 3: cache (keep unless --wipe)
rm -f dev-keeper.pid
if [ "${1:-}" = "--wipe" ]; then rm -rf .next; echo "cache wiped (--wipe)"; fi

# Phase 4: spawn ONE keeper and wait for readiness
setsid nohup bun scripts/dev-keeper-v7.ts </dev/null >/dev/null 2>&1 &
disown
ok=0
for i in $(seq 1 36); do
  sleep 5
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 8 http://localhost:3000/ 2>/dev/null)
  if [ "$code" = "200" ]; then ok=1; echo "ready after ~$((i*5))s"; break; fi
done
[ "$ok" = "1" ] || { echo "FAILED to restore (last code: $code)"; exit 1; }
echo "server verified"
exit 0
