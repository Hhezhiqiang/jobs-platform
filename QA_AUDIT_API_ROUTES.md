# QA 深度排查报告：用户端 API 路由审计

> 排查日期：2026-04-29 | 排查范围：`src/app/api/` 下所有非 admin API
> 总计审计路由文件：~95 个（排除所有 `admin/` 和 `cron/` 目录）

---

## 🔴 严重问题 (P0 — 安全漏洞)

### 1. `/api/jobs/test-jooble` 和 `/api/jobs/test-muse` — 完全无认证
- **文件**：`src/app/api/jobs/test-jooble/route.ts`, `src/app/api/jobs/test-muse/route.ts`
- **问题**：任何人都可以触发外部 API 同步，无 session 检查、无 role 检查
- **风险**：任何人都能反复调用，消耗外部 API 配额、触发 rate limit、产生大量脏数据
- **修复**：添加 `session.user.role !== 'ADMIN'` 检查

### 2. `/api/ads/track` — 无认证 + 无速率限制
- **文件**：`src/app/api/ads/track/route.ts`
- **问题**：任何人都能伪造广告点击/浏览数据，无限刷高 `clickCount`/`viewCount`
- **风险**：广告数据完全不可信，计费场景下直接经济损失
- **修复**：添加 rate limit（如每 IP 每分钟 30 次），可选加 session 校验

### 3. `/api/payments/plisio/webhook` — 签名验证未启用
- **文件**：`src/app/api/payments/plisio/webhook/route.ts`
- **问题**：代码中有 `// TODO: 验证签名（生产环境必须启用）`，但实际未执行
- **风险**：任何人发送伪造 webhook 即可给任意用户充值任意金额
- **修复**：启用签名验证，拒绝未签名或签名不正确的请求

### 4. `/api/companies/[id]/culture-tags` POST — 权限检查被注释
- **文件**：`src/app/api/companies/[id]/culture-tags/route.ts`
- **问题**：`// if (!isMember && session.user.role !== "ADMIN")` 整段被注释
- **风险**：任何登录用户都能给任意公司添加文化标签，可被恶意刷标签
- **修复**：取消注释或改为限制投票频率

### 5. `/api/companies/[id]/consensus/tags` 和 `/api/companies/[id]/consensus/vote` — 无限投票
- **文件**：`consensus/tags/route.ts`, `consensus/vote/route.ts`
- **问题**：同一用户可以对同一标签无限次投票，无去重机制
- **风险**：一人刷万票，公司文化标签数据失真
- **修复**：添加 `companyTagVotes` 关联表，确保每人每标签一票

### 6. `/api/payments/plisio/webhook` GET — 开放重定向 (XSS)
- **文件**：`src/app/api/payments/plisio/webhook/route.ts`
- **问题**：`NextResponse.redirect(new URL(url, request.url))` 中 `url` 来自用户输入 `searchParams.get("redirect")`，且 `url` 可以是 `//evil.com` 这样的协议相对 URL
- **风险**：攻击者构造恶意链接诱导用户点击后跳转到钓鱼网站
- **修复**：验证 redirect URL 必须以 `/` 开头且属于白名单域名

---

## 🟡 高危问题 (P1)

### 7. `/api/companies/[id]/culture-tags` DELETE — 任何人可删除标签
- **文件**：`src/app/api/companies/[id]/culture-tags/route.ts`
- **问题**：注释写着"简化版本：任何人都可以删除"
- **修复**：仅允许公司管理员或标签创建者删除

### 8. `/api/resumes/upload` — 文件上传安全不足
- **文件**：`src/app/api/resumes/upload/route.ts`
- **问题**：
  - 仅检查扩展名，不验证 MIME type 内容（Magic Number 检查）
  - 文件名使用 `${userId}-${timestamp}.${ext}`，可枚举
  - 无用户级别上传频率限制（只有 IP 级别 rate limit）
- **修复**：添加文件内容类型验证，限制每用户每日上传次数

### 9. `/api/ads/route.ts` GET — 未认证可获取所有广告
- **文件**：`src/app/api/ads/route.ts`
- **问题**：GET 端点没有 session 检查，任何人都能看到所有广告数据（包括未投放的）
- **修复**：用户端应只返回 `status === 'ACTIVE'` 且 `startDate <= now <= endDate` 的广告

### 10. `/api/companies/[id]/consensus/tags` POST — 无长度/内容限制
- **文件**：`src/app/api/companies/[id]/consensus/tags/route.ts`
- **问题**：只检查了 `tagName.trim().length === 0`，没有最大长度限制
- **风险**：可存入超长字符串，消耗数据库空间
- **修复**：添加 `tagName.length <= 50` 之类的限制

### 11. `/api/auth/register` — 无 CAPTCHA / 人机验证
- **文件**：`src/app/api/auth/register/route.ts`
- **问题**：仅有 IP rate limit，可被批量注册（更换 IP 即可绕过）
- **修复**：添加 reCAPTCHA / Cloudflare Turnstile

---

## 🟡 中等问题 (P2)

### 12. 响应格式不统一
**问题**：项目中存在至少 5 种响应格式：
| 风格 | 示例 | 使用范围 |
|------|------|----------|
| `{ error: "..." }` | `{ error: "未登录" }` | 大多数路由 |
| `{ success: true, ... }` | `{ success: true, items: [] }` | promoter 系列 |
| `{ message: "...", ... }` | `{ message: "更新成功" }` | company/jobs 系列 |
| `{ success: true, data: { ... } }` | salary-insights | salary 系列 |
| 直接返回数据 | `{ favorites: [], total: 0 }` | favorites 系列 |

**修复**：统一使用 `@/lib/api-response` 中的 `successNextResponse` 和 `ApiError`（已在 company/dashboard 中使用，但未推广）

### 13. 多处缺少速率限制
缺少 rate limit 的公开 API：
| 路由 | 当前保护 |
|------|----------|
| `/api/jobs/route.ts` GET | ❌ 无 |
| `/api/jobs/recommended/route.ts` | ❌ 无 |
| `/api/companies/route.ts` GET | ✅ 有 |
| `/api/companies/search/route.ts` | ❌ 无 |
| `/api/search/route.ts` | ✅ 有 (5/1s) |
| `/api/search/suggestions/route.ts` | ✅ 有 |
| `/api/stories/route.ts` GET | ❌ 无 |
| `/api/recommendations/route.ts` | ✅ 有 |
| `/api/salary-insights/route.ts` | ✅ 有 |
| `/api/ads/positions/route.ts` | ❌ 无 |

**建议**：所有公开 GET 端点都应该有 rate limit

### 14. `/api/jobs/route.ts` GET — 无分页上限
- **文件**：`src/app/api/jobs/route.ts`
- **问题**：`limit` 参数没有最大值限制，可以传 `limit=999999`
- **风险**：一次请求返回大量数据，消耗数据库和带宽
- **修复**：`const limit = Math.min(parseInt(...) || 20, 100)`

### 15. N+1 查询问题

#### 15a. `/api/company/applications/route.ts` — 列表查询
```
1. 查 company_members (1 次)
2. 查 job_applications (1 次，带 jobs/users/resumes include)
```
- `include: { jobs: {...}, users: {...}, resumes: true }` 虽然用了 include，但 `users` 会触发 `user_profiles` 的额外查询（如果 profile 关系配置为 eager）
-  severity: 低

#### 15b. `/api/company/applications/bulk/route.ts` — 循环查库
```javascript
for (const id of ids) {
  const ok = await checkPermission(...); // 每条申请一次 DB 查询
}
```
- N 条申请 = N 次权限查询
- **修复**：批量查询所有申请的 companyId，一次 JOIN 校验

#### 15c. `/api/promoter/dashboard/route.ts` — 12 次并行查询
```javascript
const [todayRegisters, todayOrders, todayGmv, todayCommission,
       totalRegisters, totalOrders, totalGmv, totalCommissionPaid] = await Promise.all([...])
```
- 8 次聚合查询 + 后续 trend 查询 + promoters findUnique
- 虽然并行执行，但总数偏高
- **修复**：考虑用一条 SQL 聚合多个指标

#### 15d. `/api/game/leaderboard/route.ts` — 排行榜 N+1
```javascript
const expLogs = await prisma.expLog.groupBy(...)  // 1 次
const profiles = await prisma.userGameProfile.findMany({ where: { in: profileIds } }) // 1 次
// 但每条 expLog 都要 find profile by id
```
- `profiles.find((p) => p.id === log.profileId)` 在循环中执行 — 虽然是内存操作但 profiles 查询可能遗漏某些 profileId
- 后续还有额外的 rank 查询

### 16. 类型安全问题

#### 16a. `any` 类型泛滥
| 文件 | 问题 |
|------|------|
| `company/applications/route.ts` | `const where: Prisma.job_applicationsWhereInput = {}` 后动态赋值 `where.jobs = { companyId }` — 类型不安全 |
| `company/jobs/route.ts` | `const where: any = companyId ? { companyId } : {}` |
| `companies/[id]/interviews/route.ts` | `const where: any = { type: "INTERVIEW" }` |
| `salary-insights/calculator/route.ts` | `const where: any = { ... }` |
| `jobs/route.ts` | `(where.AND as Prisma.jobsWhereInput[]).push(...)` — 类型断言绕过检查 |

#### 16b. `params` 类型不一致
- 新版 Next.js 要求 `params` 为 `Promise<{ id: string }>`
- 部分文件使用 `{ params: { id: string } }`（旧版写法）：
  - `companies/[id]/stories/route.ts`
  - `company/[id]/route.ts`
  - `company/applications/[id]/route.ts`
  - `company/jobs/[id]/route.ts`
  - 等等
- **风险**：升级到 Next.js 15+ 后可能崩溃

### 17. `/api/stories/[id]/route.ts` GET — viewCount 竞态条件
```javascript
// 先读取 story
const story = await prisma.careerStory.findUnique({ where: { id } });
// 然后 +1
await prisma.careerStory.update({ where: { id }, data: { viewCount: { increment: 1 } } });
// 返回时用 story.viewCount + 1
```
- `increment: 1` 是原子操作没问题，但返回的 `viewCount` 可能不是最新值
- **修复**：在 update 后返回 `select: { viewCount: true }`

### 18. `/api/applications/route.ts` POST — 竞态条件
```javascript
// 先检查是否已申请
const existingApplication = await prisma.job_applications.findFirst({ ... });
// 然后创建
const application = await prisma.job_applications.create({ ... });
```
- 两次请求同时到达时，可能创建两条重复申请
- **修复**：在数据库层添加唯一约束 `(userId, jobId)` 或使用事务

### 19. `/api/circles/recommend-jobs/route.ts` — 引用未定义函数
- **文件**：`src/app/api/circles/recommend-jobs/route.ts`
- **问题**：POST 中调用了 `checkRecommendPermission()` 但该函数定义在同一个文件的底部（GET handler 之后），虽然 JS 函数声明会 hoist，但代码结构混乱
- 另外 `checkRecommendPermission` 中查询 `story.authorId` 但没有 include story 关系

### 20. `/api/stories/[id]/comments/route.ts` — try-catch 吞错误
```javascript
try {
  comments = await prisma.storyComment.findMany({ ... });
  total = await prisma.storyComment.count({ ... });
} catch {
  comments = [];
  total = 0;
}
```
- 模型不存在时静默返回空数据，但其他数据库错误（连接超时等）也被吞掉
- **修复**：区分 `P2021`（表不存在）和其他错误

---

## 🔵 低优先级问题 (P3)

### 21. 硬编码的 API Key
- **文件**：`src/app/api/test-adzuna-direct/route.ts`
- **问题**：Adzuna appId/appKey 硬编码在源码中
- **修复**：移到 `.env`

### 22. `/api/webhooks/payment/route.ts` — 空实现
- 仅有 TODO 注释，实际不处理任何逻辑
- 如果支付服务商已配置此 webhook 地址，会导致回调失败

### 23. `/api/user/recharge/route.ts` — 空实现
- 返回 `paymentUrl: null` 和"支付接口待接入"
- 如果前端已有充值入口，用户会看到不完整的体验

### 24. 内存缓存无失效机制
- **文件**：`src/app/api/jobs/recommended/route.ts`
- `matchCache` 使用内存 Map，永远不会主动清除（只有 TTL 检查）
- 多实例部署时各实例缓存不一致

### 25. `/api/blog/view/route.ts` — 自有 rate limiter 实现
- 实现了自己的内存 rate limiter，而项目已有 `@/lib/rate-limit`
- 应复用统一模块

### 26. 密码哈希 rounds 不一致
- `auth/register/route.ts`: `bcrypt.hash(password, 12)`
- `user/profile/detail/route.ts`: `bcrypt.hash(newPassword, 12)`
- `company/register/route.ts`: `bcrypt.hash(password, 10)`
- 应统一为 12

---

## ✅ 做得好的地方

| 模块 | 亮点 |
|------|------|
| **promoter 系列** | 使用 `getAuthenticatedPromoter()` 统一认证，withdrawal 使用 `$transaction` 防止竞态 |
| **auth/register** | 有 rate limit + 邮箱格式验证 + 密码强度验证 |
| **favorites** | 有重复收藏检查（409 冲突响应）|
| **resumes/upload** | 有文件类型、大小限制 + 路径穿越防护 |
| **resumes/[id]/DELETE** | 有 realpath 路径穿越校验 |
| **user/job-status** | 使用 Zod schema 验证输入 |
| **search** | 有 rate limit + 参数验证 + 搜索词记录 |
| **recommendations** | 有 rate limit + 个性化/通用双模式 |
| **salary-insights** | 有 rate limit |
| **companies** | GET 有 rate limit，POST 有 slug 唯一性检查 |
| **cron/commission-settlement** | 有 Cron Secret 校验 |

---

## 📊 各维度评分

| 维度 | 评分 (1-10) | 说明 |
|------|------------|------|
| 权限控制 | 6/10 | 大部分路由有 auth 检查，但 6 个公开端点缺少保护 |
| 错误处理 | 7/10 | 几乎所有路由都有 try/catch，但部分 catch 吞错误 |
| 速率限制 | 5/10 | 约 40% 的公开端点有 rate limit，覆盖率不足 |
| 输入验证 | 6/10 | 部分端点用 Zod（好），但大量端点手动检查或不检查 |
| 响应格式 | 4/10 | 至少 5 种格式，非常不统一 |
| AI 调用 | N/A | 用户端 API 未使用 ai-client.ts（合理） |
| 数据库查询 | 6/10 | 有 N+1 问题但大多不严重，个别地方有优化空间 |
| 类型安全 | 5/10 | `any` 类型使用频繁，params 类型在新版 Next.js 下会报错 |

---

## 🎯 修复优先级建议

1. **立即修复 (P0)**：启用 Plisio webhook 签名验证、为 test 端点加认证、修复 ads/track 刷数据
2. **本周修复 (P1)**：文化标签权限、文件上传验证、开放重定向
3. **本月修复 (P2)**：统一响应格式、补齐 rate limit、修复 N+1、升级 params 类型
4. **后续优化 (P3)**：清理硬编码密钥、统一密码 rounds、完善空实现端点
