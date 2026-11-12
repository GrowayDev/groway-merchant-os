#!/bin/bash
cd /home/z/my-project
while true; do
    if ! pgrep -f "next-server" > /dev/null; then
        echo "[$(date)] Restarting server..." >> /home/z/my-project/keep-alive.log
        node node_modules/.bin/next dev -H 0.0.0.0 -p 3000 --webpack >> /home/z/my-project/dev.log 2>&1 &
        sleep 5
    fi
    sleep 2
done
