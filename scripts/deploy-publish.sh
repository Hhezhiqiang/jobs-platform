#!/bin/bash
export HOME=/root
cd /opt/jobs-platform
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/app/api/admin/blog/route.ts -o "src/app/api/admin/blog/route.ts"
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/app/%5Blocale%5D/admin/blog/page.tsx -o "src/app/[locale]/admin/blog/page.tsx"
mkdir -p "src/app/api/admin/blog"
nohup bash -c "npx next build > /tmp/publish-build.log 2>&1 && pkill -f 'next start'; sleep 2; nohup npx next start -p 3000 > /tmp/next.log 2>&1 &" &
echo "Deploying... wait 60s"