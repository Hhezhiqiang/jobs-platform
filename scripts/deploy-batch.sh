#!/bin/bash
export HOME=/root
cd /opt/jobs-platform
mkdir -p src/app/api/applications/batch
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/app/api/applications/batch/route.ts -o src/app/api/applications/batch/route.ts
nohup bash -c "npx next build > /tmp/batch-build.log 2>&1 && pkill -f 'next start'; sleep 2; nohup npx next start -p 3000 > /tmp/next.log 2>&1 &" &
echo "Deploying..."