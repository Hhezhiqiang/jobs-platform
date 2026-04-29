# API 和 AI 集成审计报告

**项目：** jobs-platform  
**日期：** 2026-04-29  
**审计范围：** API 路由、AI 集成、第三方 API、数据库交互、定时任务、安全  

---

## 1. API 路由检查

### 1.1 错误处理

| 路由 | 问题 |
|------|------|
| `/api/jobs/route.ts` GET | `parseInt(minSalary)` / `parseInt(maxSalary)` 未做 NaN 校验，若传入非数字会导致 Prisma 查询异常 |
| `/api/jobs/route.ts` POST | `body.title.toLowerCase()` 当 title 为 undefined 时会抛出 TypeError |
| `/api/company/register/route.ts` | `bcrypt.hash(password, 10)` 使用了 cost factor 10，而 `/api/auth/register/route.ts` 使用 12，不一致 |
| `/api/company/register/route.ts` | `generateSlug()` 使用 `Date.now().toString().slice(-6)` 生成 slug 后缀，高并发时可能冲突 |
| `/api/company/register/route.ts` | 新用户+公司创建分两步（`users.create` → `companies.create` → `company_members.create`），**没有事务包裹**，中间失败会导致孤儿数据 |
| `/api/payments/plisio/create/route.ts` | 使用 `$executeRaw` INSERT 到 `plisio_orders` 表，但该表**不在 Prisma schema 中**，属于隐式表 |
| `/api/payments/plisio/webhook/route.ts` | 支付成功时更新余额使用 `$executeRaw` UPDATE，**没有事务**，并发 webhook 可能导致余额不一致（race condition） |
| `/api/stories/route.ts` GET | `where: any` 类型不安全，companyId 未做 UUID 格式校验 |
| `/api/resumes/upload/route.ts` | 文件只保存了元数据到数据库，**实际文件未上传到任何存储**（Vercel Blob 等），`fileUrl` 指向 `/uploads/resumes/` 但无对应处理逻辑 |
| `/api/admin/sync-adzuna/route.ts` GET (`/api/jobs/adzuna/test`) | **无认证**，任何人可直接触发 Adzuna 同步和 Kimi AI 解析，消耗 API 配额 |

### 1.2 速率限制

| 路由 | 状态 |
|------|------|
| `/api/auth/register/route.ts` | ✅ 有速率限制 (10 req / 15min) |
| `/api/search/route.ts` | ✅ 有速率限制 (5 req / 1s) |
| `/api/resumes/upload/route.ts` | ✅ 有速率限制 (10 req / 1h) |
| **所有其他路由** | ❌ **无速率限制** |

**速率限制实现问题 (`src/lib/rate-limit.ts`)：**
- ⚠️ 使用内存 `Map` 存储，**多实例/Serverless 环境下完全无效**（每个实例独立 Map）
- ⚠️ `getClientIP()` 当无 `x-forwarded-for` 时返回 `"unknown"`，所有无代理用户共享同一限流桶
- ⚠️ 没有持久化、没有分布式支持

### 1.3 输入验证

**缺失输入验证的路由：**

| 路由 | 问题 |
|------|------|
| `/api/jobs/route.ts` GET | `minSalary` / `maxSalary` 未校验是否为数字 |
| `/api/search/route.ts` | 查询参数未做 XSS/SQL 注入过滤（虽然 Prisma 防注入，但 `contains` 搜索可能性能问题） |
| `/api/admin/jobs/route.ts` | `body` 字段无 zod/schema 校验 |
| `/api/company/register/route.ts` | `email` 无格式校验 |
| `/api/company/register/route.ts` | `password` 无强度校验（但 `/api/auth/register/route.ts` 有） |
| `/api/applications/route.ts` PATCH | `status` 字段未做白名单校验，可传入任意值 |
| `/api/admin/sync-adzuna/route.ts` | `keyword` / `location` 参数无长度/格式限制 |
| `/api/analytics/track/route.ts` | `eventData` 直接存入数据库，无大小/内容限制 |
| `/api/stories/[id]/comments/route.ts` | `content` 无 XSS 过滤/转义 |

### 1.4 响应格式一致性

| 问题 | 详情 |
|------|------|
| 不一致的 success 字段 | 部分路由返回 `{ success: true, data: ... }`，部分返回 `{ data: ... }`，部分直接返回数据 |
| 不一致的错误字段 | 部分返回 `{ error: "msg" }`，部分返回 `{ success: false, error: "msg" }` |
| 状态码不一致 | 创建成功有的用 200，有的用 201 |

---

## 2. AI 集成检查

### 2.1 KIMI_API_KEY 使用分布

| 文件 | 用途 | 问题 |
|------|------|------|
| `src/lib/llm.ts` | 统一 LLM 客户端 | ✅ 良好抽象，支持多 provider fallback |
| `src/lib/auto-blog-generator.ts` | 博客生成 | ⚠️ 直接使用 `KIMI_API_KEY` 而非 `llm.ts` 抽象层 |
| `src/lib/auto-translator.ts` | 翻译服务 | ⚠️ 硬编码 `moonshot-v1-8k` model，不通过 `llm.ts` |
| `src/lib/seo_plan.ts` | SEO 计划生成 | ✅ 使用 `llm.ts` 抽象层 |
| `src/app/api/admin/translate-blogs/route.ts` | 博客批量翻译 | ⚠️ 直接调用 Kimi API，绕过 `llm.ts` |
| `src/app/api/admin/keywords/collect/route.ts` | 关键词采集 | ⚠️ 条件性使用 `process.env.KIMI_API_KEY` |

### 2.2 AI 生成内容逻辑

| 问题 | 详情 |
|------|------|
| **无缓存** | AI 生成内容无缓存机制，每次请求都重新调用 API |
| **降级处理** | `seo_plan.ts` 有 fallback；`auto-blog-generator.ts` 有质量检测和草稿模式；但 `auto-translator.ts` **无降级** |
| **内容截断** | `translate-blogs/route.ts` 翻译正文时只取 `content.slice(0, 4000)`，**长文章被截断翻译** |
| **提示词注入风险** | AI prompt 直接拼接用户输入（如 `monitor.keyword`），未做清理 |
| **API Key 暴露** | `auto-translator.ts` 和 `auto-blog-generator.ts` 都直接引用 `process.env.KIMI_API_KEY`，增加维护成本 |

### 2.3 AI 服务降级处理

| 文件 | 降级策略 |
|------|---------|
| `llm.ts` | ✅ 支持 KIMI → DeepSeek → OpenAI 三级降级 |
| `seo_plan.ts` | ✅ LLM 失败时使用 `fallbackSEOPayload` |
| `auto-blog-generator.ts` | ⚠️ 两次尝试（不同 temperature），但无 fallback |
| `auto-translator.ts` | ❌ **无降级**，API 失败直接抛异常 |
| `translate-blogs/route.ts` | ⚠️ try-catch 捕获错误但单个博客失败不阻塞整体流程 |

---

## 3. 第三方 API 集成

### 3.1 Adzuna API (`src/lib/adzuna-api.ts`)

| 问题 | 严重性 |
|------|--------|
| 使用 AI 解析每个职位描述 (`parseJobDescriptionWithAI`)，每同步一个职位调用一次 Kimi API，**成本极高** | 🔴 高 |
| `fetchAdzunaBulkJobs` 三重循环（country × keyword × location），最多触发 9 次 API 调用 × 50 职位 × AI 解析 | 🔴 高 |
| 每次职位保存后 `sleep(2000)` 避免 Kimi 限流，整体同步速度极慢 | 🟡 中 |
| 硬编码 `companyId` / `authorId` 从环境变量获取，未校验是否存在 | 🟡 中 |
| 重复的错误检查：`if (!response.ok)` 出现两次 | 🟢 低 |
| `redirect: 'manual'` 获取原始链接的逻辑可能导致大量额外 HTTP 请求 | 🟡 中 |

### 3.2 Google Analytics

| 文件 | 状态 |
|------|------|
| `NEXT_PUBLIC_GA_ID` | 未在代码中发现 Google Analytics SDK 集成 |
| 分析系统 | 使用**自建 analytics**（`page_views` 表 + `/api/analytics/track`），非 GA |
| `src/lib/analytics.ts` | ✅ 统计查询使用了 `$queryRaw` 和适当的聚合，**无 N+1 问题** |

### 3.3 支付集成 (Plisio)

| 问题 | 严重性 |
|------|--------|
| **回调签名验证被注释掉** (`// TODO: 验证签名`) | 🔴 **严重** — 任何人都可伪造支付成功回调 |
| `plisio_orders` 表不在 Prisma schema 中，使用 raw SQL 操作 | 🟡 中 |
| 余额更新无事务保护，**并发 webhook 可能导致余额重复累加** | 🔴 高 |
| `GET` 方法重定向到 `/user/recharge?status=pending`，即使支付失败也显示 pending（应区分 failed） | 🟡 中 |
| `getInvoiceStatus` 通过 URL 参数传递 API Key（`?api_key=${PLISIO_API_KEY}`），可能记录在服务器日志中 | 🟡 中 |

### 3.4 邮件服务 (`src/lib/email.ts`)

| 状态 | 详情 |
|------|------|
| ✅ 配置检查 | 启动时检查 SMTP 配置 |
| ✅ 错误处理 | try-catch 包裹 |
| ⚠️ HTML 模板 | `userName` / `content` 等变量直接嵌入 HTML，**无 HTML 转义**，存在 XSS 风险 |
| ⚠️ 无队列 | 同步发送邮件，高并发时可能阻塞 |

---

## 4. 数据库交互

### 4.1 Prisma Schema (`prisma/schema.prisma`)

| 发现 | 详情 |
|------|------|
| ✅ 索引设计 | 大多数表有适当索引 |
| ✅ 级联删除 | 关系型数据使用 `onDelete: Cascade` |
| ✅ 唯一约束 | `users.email`、`companies.slug`、`favorites(userId, jobId)` 等正确设置 |
| ⚠️ 缺失索引 | `jobs.slug` 是 unique 但无额外索引用于 status 查询组合 |
| ⚠️ 缺失索引 | `job_applications.jobId` 无独立索引（只有复合索引） |
| ❌ `plisio_orders` 表 | **不在 schema 中**，完全由 raw SQL 管理 |
| ⚠️ `jobs.description` 字段 | 类型 `String` 无长度限制，可能存储大量文本 |

### 4.2 N+1 问题

| 查询 | 问题 |
|------|------|
| `analytics.ts: getJobGrowthStats` | `prisma.jobs.findMany` 获取所有 job（无限制），然后在 JS 中逐日过滤 — **如果数据量大，性能严重问题** |
| `analytics.ts: getTopJobs` | ✅ 使用 `include: { companies: true, _count: {...} }` 避免了 N+1 |
| `api/jobs/route.ts` | ✅ 使用 `include: { companies: {...} }` |
| `api/stories/route.ts` | ✅ 使用 `include` |
| `adzuna-api.ts` | 逐条 `prisma.jobs.create` 循环（非 N+1，但应使用 `createMany`） |

### 4.3 事务处理

| 操作 | 事务状态 |
|------|---------|
| `promoter.ts: createCommission` | ✅ 使用 `$transaction` |
| `promoter.ts: settleCommissions` | ✅ 使用 `$transaction` |
| `promoter.ts: clawbackCommission` | ✅ 使用 `$transaction` |
| `company/register/route.ts` | ❌ **无事务** — 用户创建、公司创建、关系绑定三步独立 |
| `plisio/webhook/route.ts` | ❌ **无事务** — 订单更新 + 余额更新 + 交易记录三步独立 |

---

## 5. 定时任务

### 5.1 Cron 路由

| 路由 | 状态 |
|------|------|
| `/api/cron/commission-settlement/route.ts` | ✅ 有 CRON_SECRET 验证 |
| `/api/admin/cleanup-data/route.ts` | ✅ 有 CLEANUP_SECRET 验证 |
| `/api/admin/cleanup-data-v2/route.ts` | ✅ 有 CLEANUP_SECRET 验证 |
| `/api/admin/translate-blogs/route.ts` | ✅ 有 CRON_SECRET 验证 |

### 5.2 幂等性

| 任务 | 幂等性 |
|------|--------|
| 佣金解冻 (`settleCommissions`) | ✅ 查询 `availableAt <= now AND status = FROZEN`，重复执行无副作用 |
| 数据清理 | 需检查具体实现 |
| 博客翻译 | ⚠️ 查询 `titleEn IS NULL`，但如果翻译中途失败，下次会重复翻译同一篇 |

### 5.3 失败重试

| 任务 | 重试逻辑 |
|------|---------|
| 佣金解冻 | ❌ **无重试** |
| 博客翻译 | ⚠️ 单篇失败不阻塞，但无自动重试 |
| 数据清理 | ❌ **无重试** |

---

## 6. 安全检查

### 6.1 CSRF 保护

| 发现 | 状态 |
|------|------|
| NextAuth | ✅ 默认包含 CSRF 保护（针对登录流程） |
| 自定义 API 路由 | ❌ **所有自定义 API 路由无 CSRF Token 验证** |
| 影响 | POST/PUT/DELETE/PATCH 路由可被跨站请求伪造攻击 |

### 6.2 XSS 防护

| 文件 | 问题 |
|------|------|
| `next.config.mjs` | ✅ `X-XSS-Protection: 1; mode=block` header |
| `next.config.mjs` | ✅ `X-Content-Type-Options: nosniff` header |
| `dangerouslySetInnerHTML` 使用 | 多处使用，但都是 `safeJsonLdStringify`（✅ 安全） |
| `email.ts` | ⚠️ HTML 邮件模板中 `userName` / `content` **未转义** |
| `comments/route.ts` | ⚠️ 评论内容直接存入数据库，前端渲染时若未转义则存在 XSS |

### 6.3 SQL 注入防护

| 状态 | 详情 |
|------|------|
| Prisma Client | ✅ 所有 Prisma 查询自动参数化 |
| `$queryRaw` / `$executeRaw` | ⚠️ 使用模板字面量语法（`` `${variable}` ``），Prisma 会参数化，**相对安全** |
| `plisio/webhook/route.ts` | ⚠️ raw SQL 中 `invoice_id` 等参数使用模板语法，由 Prisma 安全处理 ✅ |

### 6.4 环境变量泄露到客户端

| 变量 | 位置 | 风险 |
|------|------|------|
| `NEXT_PUBLIC_APP_URL` | 多处客户端代码使用 | ✅ `NEXT_PUBLIC_` 前缀正确 |
| `NEXT_PUBLIC_SITE_URL` | 客户端使用 | ✅ 正确 |
| `NEXT_PUBLIC_GA_ID` | 未发现实际使用 | 🟢 低 |
| `KIMI_API_KEY` | 仅服务端使用 | ✅ 安全 |
| `PLISIO_API_KEY` | 仅服务端使用 | ✅ 安全 |
| `DATABASE_URL` | 仅服务端使用 | ✅ 安全 |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | 仅服务端使用 | ✅ 安全 |
| `CRON_SECRET` | 仅服务端使用 | ✅ 安全 |
| `CONTACT_UNLOCK_PRICE` | 服务端使用 | ✅ 安全 |

### 6.5 其他安全问题

| 问题 | 严重性 | 详情 |
|------|--------|------|
| **Plisio webhook 签名验证被禁用** | 🔴 严重 | `verifyCallbackSignature` 被注释，伪造支付回调可任意充值 |
| **余额更新无事务** | 🔴 高 | 并发 webhook 可导致余额重复累加 |
| **公司注册的 race condition** | 🟡 中 | 用户+公司创建无事务，可能产生孤儿记录 |
| **resume 文件未实际存储** | 🟡 中 | 只存了元数据，文件 URL 无效 |
| **analytics IP 存储** | 🟡 中 | 存储用户 IP 地址，隐私合规风险（GDPR/PIPL） |
| **`/api/jobs/adzuna/test` 无认证** | 🟡 中 | 可被任何人触发，消耗 API 配额 |
| **`images.remotePatterns` 允许所有域名** | 🟡 中 | `hostname: "**"` 过于宽松，应限制为已知域名 |
| **`productionBrowserSourceMaps: true`** | 🟡 中 | 生产环境暴露源代码映射 |
| **`dangerouslyAllowSVG: true`** | 🟡 中 | 允许 SVG 图片，需配合 CSP 使用 |

---

## 总结

### 🔴 严重问题（需立即修复）

1. **Plisio webhook 签名验证被注释** — 任何人都可伪造支付回调充值
2. **余额更新无事务** — 并发请求导致余额不一致
3. **公司创建无事务** — 数据一致性问题
4. **Adzuna 同步调用 AI 解析每个职位** — 成本不可控

### 🟡 中等问题（建议尽快修复）

1. 速率限制使用内存 Map，多实例无效
2. `/api/jobs/adzuna/test` 无认证
3. 大部分 API 路由无速率限制
4. `images.remotePatterns` 过于宽松
5. 生产环境 `sourceMaps: true`
6. Resume 上传功能不完整（无实际文件存储）
7. 输入验证不完整（多个路由）
8. 响应格式不一致

### 🟢 低优先级改进

1. 统一 AI 调用通过 `llm.ts` 抽象层
2. AI 响应缓存机制
3. cron 任务重试逻辑
4. 错误响应格式标准化
5. 添加更多数据库索引
6. 邮件模板 HTML 转义
