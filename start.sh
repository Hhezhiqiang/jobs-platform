#!/bin/bash
# jobquip 启动脚本
export DATABASE_URL="postgresql://jobquip:JQdb2024%21secure@localhost:5433/jobquip"
export NODE_ENV="production"
export PORT="3000"
export NEXTAUTH_SECRET="your-nextauth-secret-key-for-production-12345"
export NEXTAUTH_URL="https://jobquip.com"
export NEXT_PUBLIC_SITE_URL="https://jobquip.com"
export JWT_SECRET="your-jwt-secret-key-for-production-12345"
export KIMI_API_KEY="sk-yBaN30XiLcyh4ZkVd7aLMukglXD6P9RSwC9nXCPhjQq3h3Ke"
export ADZUNA_APP_ID="2899dccd"
export ADZUNA_APP_KEY="86ffc0dcf27cad6c95088854de203aed"
export CRON_SECRET="26b8d084f251ae27be7c1083ec6251e6932e46c66230d39ed4f047f92db5480f"
export NEXT_PUBLIC_SITE_NAME="JobQuip"
export NEXT_PUBLIC_GA_ID="G-PLACEHOLDER_REPLACE_ME"

cd /home/admin/openclaw/workspace/jobs-platform
exec node node_modules/.bin/next start -p 3000