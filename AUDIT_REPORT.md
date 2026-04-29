# 后台系统审计报告

**审计日期**: 2026-04-29
**审计范围**: 管理后台 / 用户后台 / 企业后台 / 推荐人后台 / 认证系统

---

## 🔴 严重问题（Critical）

### 1. 管理后台大部分页面缺少服务端权限验证

**影响**: 未登录用户或非管理员可直接访问敏感管理页面，直到客户端 JS 加载后才跳转。

| 页面 | 类型 | 问题 |
|------|------|------|
| `/admin/jobs/page.tsx` | Client | ❌ 无服务端 auth 检查，仅依赖客户端 API 401 响应 |
| `/admin/companies/page.tsx` | Client | ❌ 无服务端 auth 检查 |
| `/admin/companies/new/page.tsx` | Client | ❌ 无服务端 auth 检查 |
| `/admin/ads/page.tsx` | Client | ❌ 无服务端 auth 检查 |
| `/admin/ads/new/page.tsx` | 未找到 | ❌ 页面不存在，导航中有链接 |
| `/admin/keywords/page.tsx` | Client | ❌ 无服务端 auth 检查 |
| `/admin/promoters/page.tsx` | Client | ❌ 无服务端 auth 检查 |
| `/admin/reports/cps/page.tsx` | Client | ❌ 无服务端 auth 检查 |

**对比（已正确实现的页面）**:
- ✅ `/admin/page.tsx` — 服务端检查 `session.user?.role !== "ADMIN"` → redirect
- ✅ `/admin/users/page.tsx` — 同上
- ✅ `/admin/blog/page.tsx` — 同上
- ✅ `/admin/withdrawals/page.tsx` — 同上 + Server Action 二次验证
- ✅ `/admin/analytics/page.tsx` — 同上
- ✅ `/admin/analytics/geo/page.tsx` — 同上

**修复建议**: 所有 client 组件的 admin 页面应改为在 `useEffect` 中先检查 session，或改为 Server Component 并在组件函数中做 auth 检查后 redirect。

---

### 2. `/admin/jobs/page.tsx` 分页功能完全失效

```typescript
const fetchJobs = async (page: number = 1) => {
  const res = await fetch(`/api/admin/jobs?page=1`); // ← 永远传 page=1！
```

分页 UI 存在但 `fetchJobs` 硬编码 `page=1`，用户点击任何页码都加载第一页数据。

---

### 3. 忘记密码功能完全未实现

`/auth/forgot-password/forgot-password-client.tsx` 中使用 `setTimeout` 模拟成功：

```typescript
// 这里应该调用实际的密码重置API
// 暂时模拟成功
await new Promise((resolve) => setTimeout(resolve, 1000));
setSuccess(true);
```

- 无实际 API 调用
- 无邮件发送
- 无重置 token 生成
- 用户看到"邮件已发送"但实际上什么都没发生

---

### 4. Admin Layout 无权限保护

`/admin/layout.tsx` 仅设置 robots meta，无任何 auth 检查：

```typescript
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

名为 "PrivateLayout" 但不做任何权限验证。依赖每个子页面单独检查。

---

## 🟠 重要问题（High）

### 5. 用户后台无认证保护

- `/user/layout.tsx` — 无任何认证检查
- `/user/profile/page.tsx` — 无认证，直接渲染
- `/user/recharge/page.tsx` — 无认证，API 调用前页面已渲染

任何未登录用户都能访问 `/user/*` 页面。

### 6. 推广者后台退出链接错误

`/promoter/dashboard/layout.tsx` 中：
```typescript
<Link href="/promoter/login" className="...">退出</Link>
```

"退出"按钮只是跳转到登录页，不会清除 session。应调用 `signOut()`。

### 7. 推广者注册无防刷机制

`/promoter/register/page.tsx`：
- 无邮箱唯一性检查（依赖 API）
- 无 CAPTCHA
- 无 rate limiting
- 无登录状态检查（已登录用户仍可重复申请）

### 8. `/admin/withdrawals/page.tsx` 语法错误

```typescript
const where: Prisma.withdrawal_recordsWhereInput = {};;
//                                                              ↑ 多余的分号
```

### 9. 硬编码 locale 的 redirect

多处客户端页面在 401 时 redirect 到 `/zh/auth/login/admin`，未使用当前 locale：
- `/admin/jobs/page.tsx`
- `/admin/companies/page.tsx`
- `/admin/ads/page.tsx`
- `/admin/companies/new/page.tsx`

非中文用户会被强制跳转到中文登录页。

---

## 🟡 中等问题（Medium）

### 10. 企业 Dashboard 管理员权限过大

`/api/company/dashboard/route.ts`：
```typescript
if (!membership && session.user.role !== "ADMIN") {
  // 管理员可以查看所有企业数据
}
```

管理员可以通过企业后台查看所有企业的数据（职位、申请），绕过了 admin 后台的权限隔离。

### 11. 注册后自动登录使用非标准回调

`/auth/register/register-form.tsx`：
```typescript
const loginResponse = await fetch("/api/auth/callback/credentials", {
  method: "POST",
  body: JSON.stringify({ email, password, callbackUrl: "/dashboard" }),
});
```

这不是 NextAuth 的标准登录流程，可能在某些情况下失败。

### 12. 管理员登录页面重复

存在两套管理员登录：
- `/auth/login/admin/page.tsx` — 独立的 admin 登录表单
- `/auth/login/page.tsx` — 通用登录，可通过 role switcher 登录

用户可能混淆应该用哪个入口。

### 13. 充值功能未接入支付

`/api/user/recharge/route.ts` 返回：
```json
{ "success": true, "paymentUrl": null, "message": "支付接口待接入，请联系管理员完成充值" }
```

前端 `/user/recharge/page.tsx` 显示充值选项但实际无法完成支付。

---

## 🟢 低优先级问题（Low）

### 14. `/admin/companies/new/page.tsx` 缺少 Slug 唯一性校验

表单在前端自动生成 slug，但提交时由 API 检查唯一性。如果 API 返回 400，用户需要手动修改。

### 15. 部分页面缺少加载状态

- `/admin/ads/page.tsx` — 有 loading state ✅
- `/admin/keywords/page.tsx` — 无 loading state ❌

### 16. Admin Dashboard 导航链接缺少 locale

导航中的链接如 `/admin/jobs` 没有 locale 前缀，依赖 Next.js 自动处理。如果配置不当可能导致 404。

---

## ✅ 做得好的地方

| 方面 | 评价 |
|------|------|
| 服务端页面 auth | `/admin/page.tsx`, `/admin/users/page.tsx`, `/admin/blog/page.tsx` 等服务端页面权限验证正确 |
| Server Action auth | `/admin/withdrawals/page.tsx` 的 Server Action 有二次 auth 检查 |
| NextAuth 配置 | JWT 策略、bcrypt 密码哈希、role 传递正确 |
| 密码验证 | 注册表单有 8 位+字母数字要求，前端实时校验 |
| 推广者 API auth | `getAuthenticatedPromoter()` 统一 auth 逻辑，设计良好 |
| 推广者 Dashboard | 数据看板完整（今日/累计/趋势图），余额展示清晰 |
| 企业登录 | LoginShell 组件支持 USER/COMPANY 角色切换，体验好 |
| 注册表单 UX | 密码强度实时反馈、确认密码一致性检查 |
| SEO 配置 | 管理后台页面正确设置 `robots: { index: false }` |
| 错误边界 | 客户端页面统一有 error state 和重试按钮 |
| 加载状态 | 大部分页面有 loading skeleton |

---

## 📋 修复优先级建议

1. **立即修复**: 所有客户端 admin 页面添加服务端 auth 检查（问题 #1）
2. **立即修复**: 修复分页 bug（问题 #2）
3. **立即修复**: 实现忘记密码功能或暂时隐藏入口（问题 #3）
4. **尽快修复**: 用户后台添加认证保护（问题 #5）
5. **尽快修复**: 修复推广者退出按钮（问题 #6）
6. **计划修复**: 统一管理员登录入口（问题 #12）
7. **计划修复**: 接入支付接口（问题 #13）
