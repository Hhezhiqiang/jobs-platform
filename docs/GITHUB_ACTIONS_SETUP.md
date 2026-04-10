# GitHub Actions 配置指南

## 需要的 Secrets

在 GitHub 仓库设置中添加以下 Secrets：

### 1. DATABASE_URL
```
postgresql://neondb_owner:npg_kBOYh0UR3ZjI@ep-misty-scene-a4fcqtrg-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. VERCEL_TOKEN
获取方式：
1. 访问 https://vercel.com/account/tokens
2. 创建新 Token
3. 复制并添加到 GitHub Secrets

### 3. VERCEL_ORG_ID
获取方式：
```bash
vercel teams list
```
或者从 `.vercel/project.json` 中查看

### 4. VERCEL_PROJECT_ID
获取方式：
```bash
cat .vercel/project.json
```
查看 `projectId` 字段

### 5. TELEGRAM_BOT_TOKEN（可选）
1. 在 Telegram 中找到 @BotFather
2. 创建新机器人 `/newbot`
3. 复制 Token

### 6. TELEGRAM_CHANNEL_ID（可选）
1. 创建频道或获取现有频道 ID
2. 格式：`-100xxxxxxxxxx`

---

## 设置步骤

1. 打开 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加上述所有 Secrets
4. 推送代码到 main 分支，GitHub Actions 将自动运行

---

## 手动触发

访问 GitHub 仓库 → Actions → Auto Blog Publisher → Run workflow

---

## 查看运行日志

GitHub 仓库 → Actions → 选择工作流运行 → 查看日志
