#!/bin/bash
export HOME=/root
cd /opt/jobs-platform
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/components/batch-apply-bar.tsx -o src/components/batch-apply-bar.tsx
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/app/api/applications/batch/route.ts -o src/app/api/applications/batch/route.ts
mkdir -p src/app/api/applications/batch
nohup bash -c "npx next build > /tmp/batch-build.log 2>&1 && pkill -f next.start; sleep 2; nohup npx next start -p 3000 > /tmp/next.log 2>&1 &" &
echo Deployed