#!/bin/bash
set -euo pipefail

# jobquip 启动脚本
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f ".env.production" ]; then
  set -a
  . "./.env.production"
  set +a
fi

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-https://jobquip.com}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://jobquip.com}"
export NEXT_PUBLIC_SITE_NAME="${NEXT_PUBLIC_SITE_NAME:-JobQuip}"

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${KIMI_API_KEY:?KIMI_API_KEY is required}"
: "${ADZUNA_APP_ID:?ADZUNA_APP_ID is required}"
: "${ADZUNA_APP_KEY:?ADZUNA_APP_KEY is required}"
: "${CRON_SECRET:?CRON_SECRET is required}"

exec node node_modules/.bin/next start -p "$PORT"
