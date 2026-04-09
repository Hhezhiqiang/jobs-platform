#!/bin/bash

echo "=========================================="
echo "  Jobs Platform 数据库配置助手"
echo "=========================================="
echo ""

# 检查是否有 DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    echo "✅ 检测到 DATABASE_URL 已设置"
    echo "连接字符串: ${DATABASE_URL:0:50}..."
    echo ""
else
    echo "⚠️ 未检测到 DATABASE_URL 环境变量"
    echo ""
fi

echo "请选择数据库配置方案："
echo ""
echo "1) Neon PostgreSQL (推荐 - 免费云数据库)"
echo "2) Supabase PostgreSQL (免费云数据库)"
echo "3) 已有 PostgreSQL 连接字符串"
echo "4) Docker 本地 PostgreSQL"
echo ""
read -p "请输入选项 [1-4]: " choice

case $choice in
  1)
    echo ""
    echo "📋 Neon PostgreSQL 配置步骤："
    echo ""
    echo "1. 访问 https://neon.tech 并登录"
    echo "2. 创建 New Project"
    echo "3. 选择地区: Singapore"
    echo "4. 项目名称: jobs-platform"
    echo "5. 点击 'Connection String' → 'Prisma'"
    echo "6. 复制连接字符串"
    echo ""
    read -p "粘贴连接字符串: " neon_url
    echo "DATABASE_URL=\"$neon_url\"" > .env.local
    echo "✅ 已保存到 .env.local"
    ;;
  2)
    echo ""
    echo "📋 Supabase PostgreSQL 配置步骤："
    echo ""
    echo "1. 访问 https://supabase.com"
    echo "2. 创建 New Project"
    echo "3. 选择地区: Singapore"
    echo "4. 进入 Project Settings → Database"
    echo "5. 复制 Connection string (URI)"
    echo ""
    read -p "粘贴连接字符串: " supabase_url
    echo "DATABASE_URL=\"$supabase_url\"" > .env.local
    echo "✅ 已保存到 .env.local"
    ;;
  3)
    echo ""
    read -p "请输入 PostgreSQL 连接字符串: " custom_url
    echo "DATABASE_URL=\"$custom_url\"" > .env.local
    echo "✅ 已保存到 .env.local"
    ;;
  4)
    echo ""
    echo "🐳 启动 Docker PostgreSQL..."
    docker run -d \
      --name postgres-jobs \
      -e POSTGRES_USER=jobsuser \
      -e POSTGRES_PASSWORD=jobspass \
      -e POSTGRES_DB=jobsplatform \
      -p 5432:5432 \
      postgres:15-alpine
    
    echo "DATABASE_URL=\"postgresql://jobsuser:jobspass@localhost:5432/jobsplatform\"" > .env.local
    echo "✅ Docker PostgreSQL 已启动，配置已保存"
    echo "⏳ 等待数据库就绪..."
    sleep 5
    ;;
  *)
    echo "❌ 无效选项"
    exit 1
    ;;
esac

echo ""
echo "=========================================="
echo "  正在初始化数据库..."
echo "=========================================="
echo ""

# 加载环境变量
export $(cat .env.local | xargs)

# 安装依赖
echo "📦 安装依赖..."
npm install

# 推送数据库结构
echo "📊 推送数据库结构..."
npx prisma db push

# 初始化种子数据
echo "🌱 初始化种子数据..."
npx prisma db seed

# 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

echo ""
echo "=========================================="
echo "  ✅ 数据库配置完成！"
echo "=========================================="
echo ""
echo "现在可以运行："
echo "  npm run dev        - 启动开发服务器"
echo "  npx prisma studio  - 打开数据库管理界面"
echo "  npm run build      - 构建生产版本"
echo ""
