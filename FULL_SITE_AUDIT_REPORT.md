### 📋 全站检查结果汇总

**检查时间**: 2026-04-12 04:50  
**检查范围**: 构建/类型、数据库、API安全、自动化系统、前端页面、部署配置  

---

## 🔴 P0 - 严重问题（必须立即修复）

### 1. 自动发布的 Topic 页面全部 404
**文件**: `src/app/topics/[slug]/page.tsx`  
**根因**: 只支持 5 个硬编码 slug (`java-developer` 等)，且不渲染 CMS `Page.content`。但 `publishSEOPlan` 对 `PRIMARY` 类关键词生成 `/topics/xxx` URL 并写入 `Page` 表。  
**影响**: 自动化系统发布的每一篇 topic 页面都打不开。  
**修复方案**: 重构 `topics/[slug]/page.tsx`，使其先尝试查询 `Page` 表渲染 CMS 内容；找不到 CMS 内容时再 fallback 到现有的硬编码职位聚合逻辑。

### 2. Analytics 查询存在性能灾难（OOM/Timeout 风险）
**文件**: `src/lib/analytics.ts`  
**根因**: `getVisitStats`、`getApplicationConversionStats`、`getUserGrowthStats` 等函数用 `prisma.findMany()` 不加限制地拉取 30/60 天全量数据（`pageView`、`jobApplication`、`user`），然后在 Node.js 内存中用 `.filter()` 分组统计。  
**影响**: 随着流量增长，Vercel Function 会在 10 秒内超时或被 OOM kill。目前只是数据量小所以侥幸没炸。  
**修复方案**: 所有聚合统计改用 Prisma `groupBy` 或 `_count`、`_sum` 聚合查询，避免全表加载到内存。

### 3. 发布系统存在竞态条件（Race Condition）
**文件**: `src/lib/publish-plan.ts`  
**根因**: 
```ts
const existing = await prisma.page.findUnique({ where: { slug } });
const finalSlug = existing ? `${slug}-${Date.now()}` : slug;
// 非原子操作，并发时两个请求可能同时判断为不存在
```
**影响**: 并发 cron 或快速连点时可能触发 `Unique constraint failed on the fields: (slug)`，导致发布失败。  
**修复方案**: 使用 Prisma 事务 + 原子性 `create`，或在 `create` 时 catch `P2002` 错误然后重试。

### 4. 热词采集存在竞态条件
**文件**: `src/lib/keyword-monitor.ts`  
**根因**: 
```ts
const exists = await prisma.keywordMonitor.findFirst({ where: { normalized: norm } });
if (exists) { ... } else { await prisma.keywordMonitor.create({...}) }
```
**影响**: 并发 cron 导致 `normalized` unique constraint violation，产生错误日志和脏数据。  
**修复方案**: 改用 `upsert`（`update + create` 原子操作）。

### 5. Cron 无并发锁
**根因**: `vercel.json` 每 15 分钟触发一次 cron。如果某次执行超过 15 分钟（热词采集+素材抓取+LLM生成可能超过），Vercel 会启动新实例并发执行。  
**影响**: 重复采集、重复发布、API rate limit 耗尽。  
**修复方案**: 在 cron handler 入口处实现基于数据库的分布式锁（如 `cron_lock` 表），长任务执行期间拒绝新的并发实例。

## 🟠 P1 - 高优先级问题

### 6. `/api/blog/view` 没有限流，任何人可刷阅读量
**文件**: `src/app/api/blog/view/route.ts`  
**影响**: 恶意脚本可以无限刷任意博客文章的 viewCount。  
**修复方案**: 添加基于 IP/session 的速率限制，或至少验证请求来源（Referer / User-Agent）。

### 7. PerformanceMonitor 内存泄漏
**文件**: `src/components/performance-monitor.tsx`  
**根因**: `useEffect` 创建了 5 个 `PerformanceObserver`，但 `return` cleanup 函数中一个都没有 `disconnect()`。  
**影响**: SPA 路由切换时会累加observer，长期导致内存泄漏和性能下降。只在 dev 环境显示所以不算很严重，但代码有缺陷。  
**修复方案**: 在 `useEffect` return 函数中调用所有 observer 的 `disconnect()`。

## 🟡 P2 - 中等问题

### 8. `auto-publisher` 存在非空断言风险
**文件**: `src/lib/auto-publisher.ts`  
**代码**: `planId = (await prisma.sEOPlan.findFirst({...}))!.id;`  
**修复方案**: 移除 `!`，如果找不到记录就抛出明确错误。

### 9. 8 个 API 路由缺少 `force-dynamic`
**文件**: 如 `/api/search/route.ts`、`/api/jobs/cities/route.ts` 等  
**风险**: Next.js App Router 对未标记的 API 可能默认尝试静态优化，导致 POST/动态 GET 被缓存。  
**修复方案**: 为这些路由统一添加 `export const dynamic = "force-dynamic";`。

### 10. `next.config.mjs` 的 `output: "standalone"`
**影响**: Vercel 不需要 standalone 输出，可能导致构建产物冗余或边缘缓存行为异常。  
**修复方案**: 移除或改为默认。

### 11. 没有全局中间件 (middleware.ts)
**影响**: 没有全局 rate limit、CORS 校验、admin 路由前置保护。  
**修复方案**: 创建 `src/middleware.ts` 做基础保护（可选）。

## 🟢 P3 - 优化建议

12. `console.log` 残留少量生产日志（`auto-publisher.ts`、`email.ts`）。  
13. `email.ts` 的 HTML 邮件模板缺少纯文本 fallback 完善处理。  
14. `keyword_monitors` 和 `pages` 表没有清理/TTL 机制，长期数据无限膨胀。  
15. `runAutoPipeline` 的 `take: 5` 限制虽然防止了过载，但也意味着如果 cron 周期内涌入大量热词，会有积压。

---

## ✅ 做得好的地方
- Admin API 全部有 `getServerSession` + `ADMIN` 角色校验。
- 全局 `error.tsx` 和 `global-error.tsx` 已存在。
- `/admin/analytics` 页面已存在（之前的报告误判）。
- `blog/[slug]/page.tsx` 渲染逻辑正确，支持 CMS 内容。
- TypeScript 编译零错误，Prisma Schema 验证通过。
- 没有硬编码 API key / 密码。
- XSS 防护到位（React 自动转义 + `dangerouslySetInnerHTML` 只用于已验证了来源的 JSON-LD）。
