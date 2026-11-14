#!/bin/bash
# Atomic staged E2E v2 — pre-compiles the heavy authenticated dashboard via curl
# (chrome closed) so the browser never triggers the memory-spike compile.
STAGE="${1:-dashboard}"
cd /home/z/my-project
scripts/ensure-server.sh || exit 1

# 1. Server-side login + authenticated pre-compile of the heavy dashboard
curl -s -m 30 -X POST http://localhost:3000/merchant-os/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@groway.co.za","password":"demo1234"}' \
  -c /tmp/gw-cookies.txt -o /dev/null
echo "auth pre-warm: compiling /merchant-os/app (heavy)..."
curl -s -o /dev/null -m 150 -b /tmp/gw-cookies.txt "http://localhost:3000/merchant-os/app"
echo "pre-compile done: $(ps aux | grep next-server | grep -v grep | awk '{printf "rss=%.0fMB", $6/1024}')"

# 2. Browser flow
agent-browser close >/dev/null 2>&1
agent-browser open http://localhost:3000/merchant-os/login >/dev/null 2>&1
sleep 5
agent-browser find label "Email Address" fill "demo@groway.co.za" >/dev/null 2>&1
agent-browser find label "Password" fill "demo1234" >/dev/null 2>&1
agent-browser eval "const btn=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().toLowerCase()==='sign in');if(btn)btn.click();!!btn" >/dev/null 2>&1
sleep 16
echo "URL: $(agent-browser get url 2>/dev/null)"

# 3. Wizard (robust JS clicks)
agent-browser eval "document.querySelectorAll('button').forEach(b=>{if(b.textContent.includes('Grocery & FMCG'))b.click()})" >/dev/null 2>&1
sleep 5
agent-browser eval "document.querySelectorAll('button').forEach(b=>{if(b.textContent.includes('Spaza Shop'))b.click()})" >/dev/null 2>&1
sleep 6
agent-browser eval "document.querySelectorAll('button').forEach(b=>{if(b.textContent.includes('Launch POS'))b.click()})" >/dev/null 2>&1
sleep 12
echo "URL after launch: $(agent-browser get url 2>/dev/null)"

case "$STAGE" in
  dashboard)
    echo "=== DASHBOARD ==="
    agent-browser snapshot -d 3 2>&1 | grep -iE "revenue|today|transaction|overview|R[0-9,]{4}|stock|orders" | head -10
    ;;
  payments)
    echo "=== SETTLEMENTS VIEW ==="
    agent-browser eval "document.querySelectorAll('button,[role=menuitem],a').forEach(el=>{const t=el.textContent||'';if(t.trim().toLowerCase().includes('gopay payments'))el.click()})" >/dev/null 2>&1
    sleep 10
    agent-browser snapshot -d 3 2>&1 | grep -iE "settlement|R[0-9,]{4}|pending|completed|batch|processor" | head -12
    ;;
  grosupply)
    echo "=== GROSUPPLY VIEW ==="
    agent-browser eval "document.querySelectorAll('button,[role=menuitem],a').forEach(el=>{const t=el.textContent||'';if(t.trim().startsWith('GroSupply'))el.click()})" >/dev/null 2>&1
    sleep 10
    agent-browser snapshot -d 3 2>&1 | grep -iE "supplier|SAB|Tiger|catalog|product|stock|R[0-9,]{4}" | head -12
    ;;
  sape)
    echo "=== SAPE VIEW ==="
    agent-browser eval "document.querySelectorAll('button,[role=menuitem],a').forEach(el=>{const t=el.textContent||'';if(t.trim()==='SAPE')el.click()})" >/dev/null 2>&1
    sleep 10
    agent-browser snapshot -d 3 2>&1 | grep -iE "verified|serial|trust|provenance|authentic|block|R[0-9]" | head -12
    ;;
esac

echo "=== PAGE ERRORS ($STAGE) ==="
agent-browser errors 2>&1 | tail -4
echo "=== CONSOLE (errors/warnings) ==="
agent-browser console 2>&1 | grep -iE "\[error\]|\[warning\]" | grep -viE "scroll-behavior|Download the React" | head -12
echo "STAGE $STAGE DONE"
