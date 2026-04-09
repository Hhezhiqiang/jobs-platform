# 部署指南 - 更新用户协议和隐私政策

## 问题
新创建的 `/terms` 和 `/privacy` 页面需要重新部署才能在生产环境生效。

## 部署方式

### 方式1: Git 自动部署（推荐）

```bash
# 进入项目目录
cd /root/.openclaw/workspace/jobs-platform

# 添加新文件到 Git
git add src/app/terms/page.tsx src/app/privacy/page.tsx

# 提交更改
git commit -m "添加用户协议和隐私政策页面"

# 推送到 GitHub
git push origin main
```

推送后，Vercel 会自动检测到代码变更并重新部署。

### 方式2: Vercel CLI 部署

```bash
# 登录 Vercel
vercel login

# 按照提示完成登录后，执行部署
vercel --prod
```

### 方式3: Vercel Dashboard 手动部署

1. 访问 https://vercel.com/dashboard
2. 找到 `jobs-platform` 项目
3. 点击 "Deployments" 标签
4. 选择最新的一次部署，点击 "Redeploy"

## 验证部署

部署完成后，访问以下链接验证：

- https://jobs-platform-gold.vercel.app/terms
- https://jobs-platform-gold.vercel.app/privacy

## 页面内容

### 用户协议 (/terms)
包含：
- 协议范围
- 账号注册条款
- 服务内容
- 用户行为规范
- 信息保护
- 知识产权
- 免责声明
- 争议解决

### 隐私政策 (/privacy)
包含：
- 信息收集范围
- 信息使用目的
- 信息共享规则
- Cookie 使用说明
- 用户权利（访问/更正/删除）
- 数据保护措施
- 未成年人保护

## 预计部署时间
- Git 自动部署：2-3 分钟
- CLI 手动部署：1-2 分钟
