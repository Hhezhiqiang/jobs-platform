#!/bin/bash

# 超产博客自动生成脚本
# 每小时执行一次，生成3000-7000字长文

MINUTE=$(date +%M)
if [ "$MINUTE" != "00" ]; then
  exit 0
fi

cd /root/.openclaw/workspace/jobs-platform

# 加载环境变量（优先 .env.local，次选 .env）
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
elif [ -f .env ]; then
  set -a
  source .env
  set +a
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始执行每小时博客超产..." >> /tmp/blog-hourly.log
npx tsx scripts/auto-blog-hourly.ts 2>&1 | tee -a /tmp/blog-hourly.log
EXIT_CODE=${PIPESTATUS[0]}
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 执行结束，退出码: $EXIT_CODE" >> /tmp/blog-hourly.log
exit $EXIT_CODE
