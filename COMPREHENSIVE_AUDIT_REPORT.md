# JobQuip 全面审计报告

审计时间: 2026-04-22 01:30
审计范围: 全站 360 个文件 (56 用户页 + 20 管理页 + 100 API 路由 + 组件/库)

---

## 🔴 P0 - 严重安全问题（立即修复）

### 1. 数据清理路由硬编码密钥
**文件**: `src/app/api/admin/cleanup-data/route.ts`, `cleanup-data-v2/route.ts`
**问题**: `const CLEANUP_SECRET = "cleanup-2026-04-20"` — 硬编码在源码中，可被任何人读到
**风险**: 任何人可调用此 API 删除公司和博客数据
**修复**: 改用环境变量 `process.env.CLEANUP_SECRET` 并设置强随机值

### 2. Promoter 推广者路由无认证
**文件**: `src/app/api/promoter/` 下 6 个路由全部无认证检查
- `commissions/route.ts` — 查看佣金数据
- `links/route.ts` — 创建/管理推广链接
- `withdrawals/route.ts` — 提现操作
- `dashboard/route.ts` — 仪表盘数据
- `me/route.ts` — 个人信息
**风险**: 未登录用户可访问推广者数据和提现接口
**修复**: 每个路由添加 `getServerSession` 检查 + `promoter` 角色验证

### 3. Blog view 计数路由无防护
**文件**: `src/app/api/blog/view/route.ts`
**问题**: 可被恶意刷请求刷高浏览量
**风险**: 数据污染 + 服务器资源浪费
**修复**: 添加 rate limiting

---

## 🟡 P1 - 重要问题

### 4. Google Analytics 占位符
**文件**: Vercel 环境变量 `NEXT_PUBLIC_GA_ID = G-PLACEHOLDER_REPLACE_ME`
**影响**: 完全无流量追踪
**修复**: 替换为真实 GA4 Measurement ID

### 5. Prisma 数据库缺少复合索引
**影响模型**: ad_positions, ads, companies, jobs, pages, promoters, resumes, seo_plans, seo_settings, sessions, user_profiles, users, UserGameProfile, Achievement, UserAchievement, DailyCheckin, TaskDefinition, TaskProgress (18 个 model 无复合索引)
**影响**: 查询性能差，大数据量时缓慢
**修复**: 为常用查询路径添加 `@@index`

### 6. 13 个页面无 loading 状态
**页面**: about, career-trail, contact, faq, privacy, terms, topics, unauthorized, user/recharge, promoter/dashboard, promoter/login, promoter/register, salary-insights
**影响**: 用户等待时无反馈
**修复**: 添加 `loading.tsx`

### 7. 32 处 dangerouslySetInnerHTML
**文件**: 主要集中在结构化数据 (structured-data.tsx, blog-structured-data.tsx) 和 blog-content.tsx
**风险**: XSS 攻击面
**修复**: 使用 DOMPurify 或 sanitize-html 清洗 HTML

### 8. 10+ ESLint 未使用变量
**影响**: 打包体积增大，代码混乱
**修复**: 清理未使用 imports

---

## 🟢 P2 - 优化建议

### 9. 硬编码公司 ID 在测试脚本中
**文件**: 多个 import 脚本
**风险**: 数据一致性

### 10. RSS feed 仅中文
**文件**: `src/app/rss.xml/route.ts`
**问题**: 只有 `/zh/blog` 链接
**修复**: 增加英文版链接

### 11. Sitemap 缺少英文版本动态 URL
**状态**: 已部分修复，但需确认部署

### 12. 缺少 robots.txt 中的一些搜索引擎规则
**当前**: 已覆盖 Google/Bing/Baidu/Sogou/360/DuckDuckGo/Yandex
**建议**: 添加 `crawl-delay` 避免过度爬取

---

## ✅ 已确认正常

| 检查项 | 状态 |
|--------|------|
| TypeScript 编译 | ✅ 0 错误 |
| Vercel 部署 | ✅ READY |
| robots.txt | ✅ 正常 |
| sitemap.xml | ✅ 正常 |
| 多语言切换 (i18n) | ✅ 核心页面已修复 |
| 博客英文翻译 | ✅ 全部完成 |
| 管理后台认证 | ✅ 大部分路由有保护 |
| next.config | ✅ 无 ignoreBuildErrors |
| XSS (eval/Function) | ✅ 未发现 |
| 硬编码密码 | ✅ 未发现 (除 CLEANUP_SECRET) |
| 邮件发送 (SMTP) | ✅ 已配置 |
| 支付集成 (Plisio) | ✅ Webhook 有签名验证 |

---

## 修复优先级

1. **立即**: 修复 CLEANUP_SECRET 硬编码 (P0 #1)
2. **立即**: 为 Promoter API 添加认证 (P0 #2)
3. **今日**: 配置真实 GA ID (P1 #4)
4. **本周**: 添加数据库索引 (P1 #5)
5. **本周**: 添加 loading 状态 (P1 #6)
6. **本月**: 清理未使用代码 + sanitize HTML (P1 #7, #8)
