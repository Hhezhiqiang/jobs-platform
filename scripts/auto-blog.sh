#!/bin/bash

# 博客自动生成脚本
# 每2小时执行一次

HOUR=$(date +%H)
MINUTE=$(date +%M)

# 只在整点（00分）且为偶数小时执行，避免重复
if [ "$MINUTE" != "00" ]; then
  exit 0
fi

if [ $((HOUR % 2)) -ne 0 ]; then
  exit 0
fi

# 记录日志
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始执行博客自动生成..." >> /tmp/blog-auto.log

# 进入项目目录并执行
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

npx tsx scripts/auto-blog.ts 2>&1 | tee -a /tmp/blog-auto.log

EXIT_CODE=${PIPESTATUS[0]}
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 执行结束，退出码: $EXIT_CODE" >> /tmp/blog-auto.log

exit $EXIT_CODE
