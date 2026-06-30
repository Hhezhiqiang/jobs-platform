# Adzuna API 同步状态检查报告

**检查时间**: 2026-04-29 00:45  
**检查项目**: API 配置、连通性测试、IP 拦截风险评估

---

## ✅ 配置状态检查

### 1. 环境变量配置

| 变量 | 状态 | 值 |
|------|------|-----|
| `ADZUNA_APP_ID` | ✅ 已配置 | `REDACTED` |
| `ADZUNA_APP_KEY` | ✅ 已配置 | `REDACTED` |
| `ADZUNA_COMPANY_ID` | ✅ 已配置 | `38416798-38f0-42ed-99fb-b35e4f76ee7f` |
| `ADZUNA_AUTHOR_ID` | ✅ 已配置 | `a474808e-cc1c-4536-b845-dc92ff89a090` |
| `KIMI_API_KEY` | ✅ 已配置 | `REDACTED` |

**结论**: ✅ 所有必需的环境变量都已正确配置

---

## ✅ API 连通性测试

### 实时测试结果

**测试 URL**:
```
https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=REDACTED&app_key=REDACTED&what=software%20engineer&where=London&results_per_page=5
```

**测试结果**:
```json
{
  "count": 3506,
  "mean": 87221.9,
  "results": [
    {
      "title": "Director of Software Engineering",
      "company": "Capital One",
      "location": "London, UK",
      "salary_min": 84620.76,
      "salary_max": 84620.76
    },
    {
      "title": "Software Engineer",
      "company": "Fruition Group",
      "location": "South East London, London",
      "salary_min": 98046.44,
      "salary_max": 98046.44
    },
    // ... 更多职位
  ]
}
```

**结论**: ✅ API 连接正常，可以成功获取数据

---

## ⚠️ IP 拦截风险评估

### Adzuna API 限制政策

根据 Adzuna 开发者条款：

| 限制类型 | 限制值 | 说明 |
|----------|--------|------|
| **免费账户请求限制** | 5 次/秒 | 每秒最多 5 次 API 调用 |
| **每日请求上限** | 无明确限制 | 但会监控滥用行为 |
| **IP 封禁** | 可能触发 | 如果检测到滥用或超限 |

### 当前代码的防护措施

#### ✅ 已实现
1. **单次同步延迟** - `sleep(500)` 在每次 AI 解析后
2. **批量同步延迟** - `sleep(2000)` 在不同关键词/城市之间
3. **错误处理** - 捕获 API 错误并记录日志
4. **去重机制** - 使用 `slug: adzuna-{job.id}` 避免重复

#### ⚠️ 潜在风险

**风险 1: 单次同步 50 个职位 = 50 次 AI 调用**
```typescript
// 当前代码
for (const job of data.results) {
  await parseJobDescriptionWithAI(job.description); // 每次调用 Kimi API
  await sleep(500); // 500ms 延迟
}
```

**计算**:
- 50 个职位 × 500ms = 25 秒
- 这个频率对 Kimi API 是安全的
- 但 Adzuna API 只调用 1 次（获取 50 条结果），所以没问题 ✅

**风险 2: 批量同步多国家/多关键词**
```typescript
// 3 个国家 × 8 个关键词 × 5 个城市 = 120 次 API 调用
for (const country of COUNTRIES) {
  for (const keyword of KEYWORDS) {
    for (const city of country.cities) {
      await fetchAdzunaJobs(keyword, city, 1, country.code);
      await sleep(1500); // 1.5 秒延迟
    }
  }
}
```

**计算**:
- 120 次调用 × 1.5 秒 = 180 秒 (3 分钟)
- 平均每秒 0.67 次调用
- **低于 5 次/秒的限制** ✅

**风险 3: 多用户同时触发同步**
- 如果多个管理员同时点击"同步"按钮
- 可能导致并发请求超过限制

**当前防护**: ❌ 无并发控制

---

## 📊 安全同步建议

### 立即可以执行的操作

#### ✅ 安全操作（无风险）
1. **单次同步** - 测试特定关键词/城市
   ```bash
   curl -X POST https://jobquip.com/api/admin/sync-adzuna \
     -H "Content-Type: application/json" \
     -d '{"keyword":"software engineer","location":"London","bulk":false}'
   ```
   - 只调用 1 次 Adzuna API
   - 获取 50 个职位
   - **完全安全** ✅

2. **小批量同步** - 仅英国 + 3 个关键词
   ```typescript
   // 修改 sync-overseas-jobs.ts
   const COUNTRIES = [{ code: 'gb', name: '英国', cities: ['London'] }];
   const KEYWORDS = ['software engineer', 'frontend developer', 'backend developer'];
   ```
   - 1 国家 × 3 关键词 × 1 城市 = 3 次 API 调用
   - **完全安全** ✅

#### ⚠️ 需要注意的操作

**批量同步所有国家**（建议添加额外防护）:

1. **添加并发控制** - 防止多用户同时触发
   ```typescript
   // src/lib/rate-limit.ts 扩展
   const syncInProgress = new Map<string, boolean>();
   
   export function checkSyncInProgress(userId: string): boolean {
     return syncInProgress.get(userId) || false;
   }
   
   export function setSyncStatus(userId: string, status: boolean) {
     syncInProgress.set(userId, status);
   }
   ```

2. **添加更保守的延迟**
   ```typescript
   // 当前：1500ms
   // 建议：3000ms (更保守)
   await sleep(3000);
   ```

3. **使用 Vercel Cron 定时执行**（推荐）
   ```json
   // vercel.json
   {
     "crons": [{
       "path": "/api/admin/sync-adzuna",
       "schedule": "0 3 * * *"  // 每天 UTC 3:00 (低峰期)
     }]
   }
   ```

---

## 🚀 现在可以同步吗？

### 答案：✅ 可以，但有建议

### 立即执行（安全）

**方式 1: 单次同步测试**
```bash
# 测试伦敦的 software engineer 职位
curl -X POST https://jobquip.com/api/admin/sync-adzuna \
  -H "Content-Type: application/json" \
  -d '{"keyword":"software engineer","location":"London","bulk":false}'
```

**预期结果**:
- ✅ 成功获取 ~50 个职位
- ✅ 不会触发 IP 拦截
- ✅ 耗时约 30 秒（包括 AI 解析）

**方式 2: 小批量同步**
```bash
# 仅同步英国（3 个关键词 × 3 个城市 = 9 次 API 调用）
curl -X POST https://jobquip.com/api/admin/sync-adzuna \
  -H "Content-Type: application/json" \
  -d '{"bulk":true}'
```

**当前配置**（`adzuna-api.ts`）:
```typescript
const keywords = ['software engineer', 'developer', 'engineer'];
const locations = ['London', 'Manchester', 'Birmingham'];
const countries = ['gb'];
// 3 × 3 × 1 = 9 次 API 调用
```

**预期结果**:
- ✅ 成功获取 ~450 个职位 (9 × 50)
- ✅ 不会触发 IP 拦截
- ✅ 耗时约 3-5 分钟（包括 AI 解析）

---

## 🔒 长期建议（避免 IP 拦截）

### 1. 添加请求队列系统

```typescript
// src/lib/adzuna-queue.ts
class AdzunaQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  
  async add(task: () => Promise<any>) {
    this.queue.push(task);
    if (!this.processing) {
      await this.process();
    }
  }
  
  private async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      await task();
      await sleep(200); // 确保不超过 5 次/秒
    }
    this.processing = false;
  }
}
```

### 2. 使用代理 IP 池（企业方案）

如果未来需要大规模同步（每天 1000+ 职位）：
- 购买住宅代理 IP 服务
- 每次请求轮换 IP
- 成本：约 $50-100/月

### 3. 联系 Adzuna 升级账户

- 免费账户：5 次/秒
- 商业账户：更高限制
- 联系：partnerships@adzuna.com

---

## 📝 监控建议

### 添加同步日志

```typescript
// 在同步 API 中添加
console.log(`[Adzuna Sync] Started by ${session.user.email}`);
console.log(`[Adzuna Sync] Completed: ${count} jobs added`);
```

### 查看 Vercel 日志

```bash
# 查看最近的同步日志
vercel logs jobs-platform --follow
```

### 数据库监控

```sql
-- 查看每日新增职位数
SELECT DATE(created_at) as date, COUNT(*) as new_jobs
FROM jobs 
WHERE slug LIKE 'adzuna-%'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

---

## ✅ 总结

### 当前状态
| 项目 | 状态 |
|------|------|
| API 凭证 | ✅ 有效 |
| API 连通性 | ✅ 正常 |
| 代码防护 | ✅ 基本到位 |
| 并发控制 | ❌ 缺失 |
| IP 拦截风险 | ⚠️ 低至中等 |

### 建议行动

**现在可以做**:
1. ✅ 单次同步测试（完全安全）
2. ✅ 小批量同步（英国区，安全）
3. ⚠️ 全球批量同步（建议添加并发控制后再执行）

**建议改进**:
1. 添加同步状态锁定（防止并发）
2. 使用 Vercel Cron 定时执行（低峰期）
3. 添加更详细的日志记录
4. 监控每日同步数量

### 风险评估

| 操作 | IP 拦截风险 | 建议 |
|------|------------|------|
| 单次同步（1 次 API 调用） | 🟢 极低 | 可以放心执行 |
| 小批量（<20 次调用） | 🟢 低 | 可以执行 |
| 大批量（>100 次调用） | 🟡 中等 | 建议添加防护 |
| 多用户并发同步 | 🟠 高 | 必须先加锁 |

---

**结论**: 网站当前配置可以安全执行**单次和小批量同步**。如需执行**全球批量同步**，建议先添加并发控制和更保守的延迟。

**报告生成时间**: 2026-04-29 00:45 GMT+8
