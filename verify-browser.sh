#!/bin/bash
# Browser verification script: starts dev server, runs agent-browser checks, then cleans up.
set +e
cd /home/z/my-project

pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2
rm -f dev.log

# Start dev server bound to all interfaces
setsid node node_modules/.bin/next dev -H 0.0.0.0 -p 3000 > dev.log 2>&1 < /dev/null &
SERVER_PID=$!
disown

# Wait for readiness
READY=0
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null)
  if echo "$code" | grep -qE "200|307|308"; then READY=1; echo "Server ready after ${i}s (HTTP $code)"; break; fi
  sleep 1
done

if [ "$READY" != "1" ]; then
  echo "ERROR: dev server did not become ready"
  tail -20 dev.log
  pkill -f "next dev" 2>/dev/null
  exit 1
fi

# Clear any prior console state in agent-browser
agent-browser close 2>/dev/null
agent-browser console --clear 2>/dev/null
agent-browser errors --clear 2>/dev/null

echo ""
echo "============================================"
echo "TEST 1: Home page http://localhost:3000/"
echo "============================================"
agent-browser open http://localhost:3000/ --timeout 60000
OPEN_RC=$?
echo "open exit code: $OPEN_RC"
agent-browser wait --load networkidle --timeout 30000 2>/dev/null
echo "--- Title ---"
agent-browser get title 2>&1
echo "--- URL ---"
agent-browser get url 2>&1
echo "--- Snapshot (interactive, compact) ---"
agent-browser snapshot -i -c 2>&1 | head -40
echo "--- Screenshot saved ---"
agent-browser screenshot /home/z/my-project/verify-home.png 2>&1
echo ""
echo "============================================"
echo "TEST 2: Login page http://localhost:3000/merchant-os/login"
echo "============================================"
agent-browser open http://localhost:3000/merchant-os/login --timeout 60000
OPEN_RC2=$?
echo "open exit code: $OPEN_RC2"
agent-browser wait --load networkidle --timeout 30000 2>/dev/null
echo "--- Title ---"
agent-browser get title 2>&1
echo "--- URL ---"
agent-browser get url 2>&1
echo "--- Snapshot (interactive, compact) ---"
agent-browser snapshot -i -c 2>&1 | head -50
echo "--- Screenshot saved ---"
agent-browser screenshot /home/z/my-project/verify-login.png 2>&1

echo ""
echo "============================================"
echo "CONSOLE & ERRORS"
echo "============================================"
echo "--- Console messages ---"
agent-browser console 2>&1 | head -40
echo "--- Page errors ---"
agent-browser errors 2>&1 | head -40

echo ""
echo "============================================"
echo "DONE - cleaning up server"
echo "============================================"
agent-browser close 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
exit 0
