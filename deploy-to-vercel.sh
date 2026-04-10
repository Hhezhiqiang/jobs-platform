#!/bin/bash
# Vercel + Neon 一键部署脚本
# 生成时间: 2026-04-10
# 使用方法: bash deploy-to-vercel.sh

echo "🚀 开始部署 jobs-platform 到 Vercel..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否安装了 vercel
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

# 检查是否登录
if ! vercel whoami &> /dev/null; then
    echo "🔑 请先登录 Vercel..."
    vercel login
fi

echo "✅ Vercel CLI 已就绪"
echo ""

# 进入项目目录
cd "$(dirname "$0")" || exit

# 检查是否为 git 仓库
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ 错误: 当前目录不是 git 仓库${NC}"
    echo "请确保在项目根目录执行此脚本"
    exit 1
fi

echo "📋 部署配置:"
echo "  - 项目: jobs-platform"
echo "  - 框架: Next.js"
echo "  - 数据库: Neon PostgreSQL"
echo ""

# 询问是否已创建 Neon 数据库
echo -e "${YELLOW}⚠️  在开始之前，请确保:${NC}"
echo "  1. 已注册 Vercel 账号 (https://vercel.com/signup)"
echo "  2. 已创建 Neon 数据库 (https://neon.tech)"
echo "  3. 已获取 DATABASE_URL"
echo ""

read -p "是否已准备好 DATABASE_URL? (y/n): " ready

if [ "$ready" != "y" ] && [ "$ready" != "Y" ]; then
    echo ""
    echo "📖 请先完成以下步骤:"
    echo ""
    echo "1️⃣  注册 Vercel:"
    echo "    https://vercel.com/signup (选择 Continue with GitHub)"
    echo ""
    echo "2️⃣  创建 Neon 数据库:"
    echo "    https://neon.tech"
    echo "    - 点击 'New Project'"
    echo "    - 创建数据库"
    echo "    - 复制连接字符串 (Connection String)"
    echo "    - 格式: postgresql://用户名:密码@主机名/数据库名?sslmode=require"
    echo ""
    echo "3️⃣  重新运行此脚本"
    exit 0
fi

echo ""
echo "🔗 链接到 Vercel 项目..."
vercel link

echo ""
echo "🔧 配置环境变量..."
echo "请粘贴你的 DATABASE_URL (格式: postgresql://...):"
read -s database_url

if [ -z "$database_url" ]; then
    echo -e "${RED}❌ DATABASE_URL 不能为空${NC}"
    exit 1
fi

# 添加环境变量
echo "$database_url" | vercel env add DATABASE_URL production
echo "$database_url" | vercel env add DATABASE_URL preview

echo ""
echo "📤 部署到 Vercel..."
vercel --prod

echo ""
echo -e "${GREEN}✅ 部署完成!${NC}"
echo ""
echo "📝 下一步:"
echo "  1. 访问 Vercel Dashboard 查看部署状态"
echo "  2. 配置自定义域名 (如果需要)"
echo "  3. 导入 ABetterWeb3 岗位数据"
echo ""
echo "  Dashboard: https://vercel.com/dashboard"
echo ""

# 询问是否导入岗位数据
read -p "是否现在导入 ABetterWeb3 岗位数据? (y/n): " import_jobs

if [ "$import_jobs" = "y" ] || [ "$import_jobs" = "Y" ]; then
    echo ""
    echo "📥 导入岗位数据..."
    echo "请在 Vercel Dashboard → Storage → Neon → SQL Editor 中执行:"
    echo ""
    echo "文件路径: scripts/import-abetterweb3-jobs.sql"
    echo ""
    echo "或者使用 psql:"
    echo "  psql '$database_url' < scripts/import-abetterweb3-jobs.sql"
fi

echo ""
echo "🎉 完成!"
