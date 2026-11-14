#!/bin/bash
# Final verification: fresh load, walk all key views, capture data + errors.
cd /home/z/my-project
scripts/ensure-server.sh || exit 1
curl -s -m 30 -X POST http://localhost:3000/merchant-os/api/auth/login -H "Content-Type: application/json" -d '{"email":"demo@groway.co.za","password":"demo1234"}' -c /tmp/gw-cookies.txt -o /dev/null
curl -s -o /dev/null -m 120 -b /tmp/gw-cookies.txt "http://localhost:3000/merchant-os/app"

agent-browser close >/dev/null 2>&1
agent-browser set viewport 1440 900 >/dev/null 2>&1
agent-browser open http://localhost:3000/merchant-os/login >/dev/null 2>&1
sleep 6
agent-browser find label "Email Address" fill "demo@groway.co.za" >/dev/null 2>&1
agent-browser find label "Password" fill "demo1234" >/dev/null 2>&1
agent-browser eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim().toLowerCase()==='sign in')?.click()" >/dev/null 2>&1
sleep 18
agent-browser eval "document.querySelectorAll('button').forEach(b=>{if(b.textContent.includes('Grocery & FMCG'))b.click()})" >/dev/null 2>&1; sleep 5
agent-browser eval "document.querySelectorAll('button').forEach(b=>{if(b.textContent.includes('Spaza Shop'))b.click()})" >/dev/null 2>&1; sleep 6
agent-browser eval "document.querySelectorAll('button').forEach(b=>{if(b.textContent.includes('Launch POS'))b.click()})" >/dev/null 2>&1; sleep 12
echo "in-app: $(agent-browser get url)"

click_view() {
  agent-browser eval "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='$1');if(!b)return 'NOT FOUND';b.click();return 'clicked'})()" >/dev/null 2>&1
  sleep 14
  echo "--- $1 ---"
  agent-browser snapshot -s "main" -d 5 2>&1 | grep -iE "R[0-9,]{3,}|settlement|batch|supplier|verified|serial|trust|transaction|total|provenance|processor" | head -8
}

click_view "Payment Gateway"
click_view "GroSupply"
click_view "SAPE"
click_view "Transactions"

echo "=== FINAL ERRORS ==="
agent-browser errors 2>&1 | tail -4
echo "=== FINAL CONSOLE (err/warn) ==="
agent-browser console 2>&1 | grep -iE "\[error\]|\[warning\]" | grep -viE "scroll-behavior|Download the React" | head -8
echo "DONE"
