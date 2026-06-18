#!/bin/bash
# 博客 & 关键词优化部署

export HOME=/root
cd /opt/jobs-platform

echo "=== Downloading updates ==="
# Pull latest from GitHub
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/lib/keyword-monitor.ts -o src/lib/keyword-monitor.ts
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/lib/keyword-sources/realtime-hot-topics.ts -o src/lib/keyword-sources/realtime-hot-topics.ts
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/app/%5Blocale%5D/admin/blog/page.tsx -o "src/app/[locale]/admin/blog/page.tsx"
echo "  Files downloaded"

echo "=== Rebuilding ==="
nohup bash -c "cd /opt/jobs-platform && npx next build > /tmp/opt-build.log 2>&1 && pkill -f 'next start'; sleep 2; nohup npx next start -p 3000 > /tmp/next.log 2>&1 &" &
echo "  Build started in background"

sleep 5
tail -3 /tmp/opt-build.log 2>/dev/null
echo "=== Done ==="