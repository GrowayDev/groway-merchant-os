#!/bin/bash
cd /home/z/my-project
NODE_OPTIONS="--max-old-space-size=2048" node node_modules/next/dist/bin/next dev -p 3000

