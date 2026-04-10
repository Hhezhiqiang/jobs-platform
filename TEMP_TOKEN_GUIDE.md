# 临时 Token 使用指南

## 创建步骤

### Vercel Token
1. 访问: https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 配置:
   - Name: `temp-assistant-$(date +%Y%m%d)`
   - Scope: 选择你的项目 (Hobby 用户选个人 scope)
   - Expiration: 1 day (24小时后自动失效)
   - Permissions: 仅勾选 "Project" 相关
4. 复制 Token

### Neon Token (如需要)
1. 访问: https://console.neon.tech/app/projects
2. 选择你的项目
3. 左侧菜单 → "Connection Details"
4. 复制 DATABASE_URL (包含密码)

## 安全提供方式

**方式1: 让我读取临时文件**
```bash
# 创建临时文件
echo "你的_vercel_token" > /tmp/vercel_token.txt
echo "你的_database_url" > /tmp/db_url.txt

# 告诉我文件路径，我会读取后立即删除
```

**方式2: 直接粘贴（会话内有效）**
直接在聊天中发送，我处理完后立即忘记。

## ⚠️ 重要提醒

1. **Token 权限**: 只给我最小权限（只能操作你的项目，不能访问其他）
2. **过期时间**: 设置为 1-24 小时，用完即废
3. **使用完后**: 立即在 Vercel 控制台撤销 Token
4. **不要分享**: 不要把 Token 发给其他人或保存在公开地方

## 我能帮你做什么

有了临时 Token，我可以：
- 部署你的项目
- 配置环境变量
- 查看部署日志
- 导入数据库

我不能/不会：
- 访问你的其他项目
- 修改你的 GitHub 代码
- 查看你的个人信息
- 保存或使用 Token 超过本次会话

## 撤销 Token

用完后立即撤销：
https://vercel.com/account/tokens
点击 Token 旁边的 "Delete"
