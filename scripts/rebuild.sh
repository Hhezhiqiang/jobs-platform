#!/bin/bash
# Rebuild jobquip.com after importing 2,269 jobs
export HOME=/root
cd /opt/jobs-platform
echo "Rebuilding..."
nohup bash -c "cd /opt/jobs-platform && npx next build > /tmp/rebuild.log 2>&1 && pkill -f 'next start'; sleep 2; nohup npx next start -p 3000 > /tmp/next.log 2>&1 &" &
echo "Build started in background"