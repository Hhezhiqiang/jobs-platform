#!/bin/bash

# 智能博客自动生成脚本（统一入口）
# 支持常规发布和长文超产
# 当 LLM API 不可用时，自动回退到 DEMO 模式

HOUR=$(date +%H)
MINUTE=$(date +%M)

# 只在整点执行
if [ "$MINUTE" != "00" ]; then
  exit 0
fi

# 判断是常规还是长文模式
# 偶数小时：常规模式（3000-5000字）
# 奇数小时：长文模式（5000-7000字）
MODE="standard"
if [ $((HOUR % 2)) -eq 0 ]; then
  MODE="standard"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始执行常规博客生成（每2小时）..."
else
  MODE="long"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始执行长文博客生成（每小时）..."
fi

# 进入项目目录
cd /root/.openclaw/workspace/jobs-platform

# 加载环境变量（强制覆盖系统环境变量）
if [ -f .env ]; then
  while IFS='=' read -r key value; do
    # 跳过注释和空行
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    # 去除引号
    value=$(echo "$value" | sed -e 's/^["\']//' -e 's/["\']$//')
    export "$key=$value"
  done < .env
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 使用模型: ${KIMI_MODEL:-default}"

# 导出模式环境变量
export BLOG_GEN_MODE=$MODE

# 运行内容生成器
npx tsx scripts/smart-content-generator.ts 2>&1 | tee -a /tmp/smart-blog.log

EXIT_CODE=${PIPESTATUS[0]}
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 执行结束，退出码: $EXIT_CODE" >> /tmp/smart-blog.log

exit $EXIT_CODE
