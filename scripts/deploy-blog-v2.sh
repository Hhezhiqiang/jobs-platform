#!/bin/bash
# 一键部署：博客发布按钮 + 搜索筛选
export HOME=/root
cd /opt/jobs-platform

echo "=== Downloading files ==="
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/app/%5Blocale%5D/admin/blog/page.tsx -o "src/app/[locale]/admin/blog/page.tsx"
mkdir -p src/app/api/admin/blog
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/app/api/admin/blog/route.ts -o src/app/api/admin/blog/route.ts
echo "  Done"

echo "=== Building ==="
npx next build 2>&1 | tail -20
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
    echo "=== Build OK, restarting ==="
    pkill -f "next start" 2>/dev/null
    sleep 2
    nohup npx next start -p 3000 > /tmp/next.log 2>&1 &
    sleep 5
    echo "=== Verify ==="
    ss -tlnp | grep 3000
    curl -so /dev/null -w "HTTP:%{http_code}" https://jobquip.com/
else
    echo "=== Build FAILED ==="
    echo "Check /tmp/ for logs"
fi