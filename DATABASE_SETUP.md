# 数据库配置指南

## 方案1：Neon PostgreSQL（推荐）

### 1. 注册 Neon 账号
访问 https://neon.tech 使用 GitHub 账号登录

### 2. 创建项目
1. 点击 "New Project"
2. 选择地区：建议 Singapore (ap-southeast-1) 离中国最近
3. 项目名称：jobs-platform
4. 创建数据库

### 3. 获取连接字符串
1. 进入项目 Dashboard
2. 点击 "Connection String"
3. 选择 "Prisma" 格式
4. 复制连接字符串

### 4. 配置环境变量
将连接字符串添加到 .env 文件：
```bash
DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"
```

## 方案2：Supabase PostgreSQL

### 1. 注册 Supabase
访问 https://supabase.com

### 2. 创建项目
1. 新建 Organization
2. 创建 Project
3. 选择地区：Singapore

### 3. 获取连接字符串
1. 进入 Project Settings → Database
2. 复制 Connection string (URI)
3. 使用 Session pooler 连接串

## 数据库初始化

配置好 DATABASE_URL 后，执行：

```bash
# 1. 安装依赖
npm install

# 2. 推送数据库结构
npx prisma db push

# 3. 初始化种子数据
npx prisma db seed

# 4. 生成 Prisma Client
npx prisma generate
```

## 验证连接

```bash
npx prisma studio
```

这将打开 Prisma Studio 图形界面，可以查看和管理数据库。

## 生产环境

部署到 Vercel 时，在 Project Settings → Environment Variables 中添加：
- Name: `DATABASE_URL`
- Value: 你的连接字符串

## 备选：本地 PostgreSQL

如果需要在本地开发：

```bash
# Docker 方式运行
docker run -d \
  --name postgres \
  -e POSTGRES_USER=jobsuser \
  -e POSTGRES_PASSWORD=jobspass \
  -e POSTGRES_DB=jobsplatform \
  -p 5432:5432 \
  postgres:15

# 连接字符串
DATABASE_URL="postgresql://jobsuser:jobspass@localhost:5432/jobsplatform"
```
