# Adzuna API 海外职位同步指南

## 📋 概述

Adzuna 是一个全球性的职位搜索引擎，覆盖 50+ 国家。通过其 API 可以自动同步海外职位到你的招聘平台。

---

## 🔧 前置配置

### 1. 注册 Adzuna 开发者账号

1. 访问 https://developer.adzuna.com/
2. 注册账号并登录
3. 创建应用获取 API 凭证：
   - **App ID** (例：`a1b2c3d4`)
   - **App Key** (例：`e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`)

### 2. 配置环境变量

在 Vercel 或本地 `.env.local` 中添加：

```bash
# Adzuna API 凭证
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key

# 公司和作者 ID（用于关联职位）
ADZUNA_COMPANY_ID=公司 UUID（从数据库 companies 表获取）
ADZUNA_AUTHOR_ID=管理员用户 UUID（从数据库 users 表获取）

# Kimi API（用于 AI 解析职位描述）
KIMI_API_KEY=your_kimi_api_key
```

---

## 📊 同步流程

### 完整流程图

```
┌─────────────┐
│ 1. 配置参数  │
│ - 国家/地区  │
│ - 关键词     │
│ - 城市       │
└──────┬──────┘
       ↓
┌─────────────┐
│ 2. 调用 API  │
│ GET /jobs/  │
│ {country}/  │
│ search/{page}│
└──────┬──────┘
       ↓
┌─────────────┐
│ 3. 解析响应 │
│ - 职位信息   │
│ - 公司名     │
│ - 地点       │
│ - 薪资       │
└──────┬──────┘
       ↓
┌─────────────┐
│ 4. AI 解析   │
│ Kimi API    │
│ 结构化描述   │
└──────┬──────┘
       ↓
┌─────────────┐
│ 5. 生成标签 │
│ - 地区标签   │
│ - 城市标签   │
│ - 行业标签   │
└──────┬──────┘
       ↓
┌─────────────┐
│ 6. 存入数据库│
│ Prisma      │
│ jobs 表      │
└─────────────┘
```

---

## 🚀 同步方式

### 方式 1：单次同步（管理后台手动触发）

**API 端点**: `POST /api/admin/sync-adzuna`

**请求体**:
```json
{
  "keyword": "software engineer",
  "location": "London",
  "bulk": false
}
```

**响应**:
```json
{
  "success": true,
  "count": 50,
  "message": "成功同步 50 个职位"
}
```

**使用场景**: 测试特定关键词/城市的职位

---

### 方式 2：批量同步（管理后台一键同步）

**API 端点**: `POST /api/admin/sync-adzuna`

**请求体**:
```json
{
  "bulk": true
}
```

**默认配置**（可在 `adzuna-api.ts` 中修改）:
- **关键词**: software engineer, developer, engineer
- **城市**: London, Manchester, Birmingham
- **国家**: gb (英国)

**使用场景**: 日常批量获取职位

---

### 方式 3：全球多国家同步（脚本执行）

**执行脚本**: `src/lib/sync-overseas-jobs.ts`

**支持国家**:
| 国家 | 代码 | 城市 |
|------|------|------|
| 英国 | gb | London, Manchester, Birmingham |
| 美国 | us | New York, San Francisco, Seattle |
| 新加坡 | sg | Singapore |
| 德国 | de | Berlin, Munich, Frankfurt |
| 澳洲 | au | Sydney, Melbourne |

**关键词列表**:
- software engineer
- frontend developer
- backend developer
- fullstack developer
- devops engineer
- data scientist
- product manager
- ux designer

**执行方式**:
```bash
# 本地执行
cd jobs-platform
npx tsx src/lib/sync-overseas-jobs.ts

# 或通过 API 触发（需扩展）
POST /api/admin/sync-all-jobs
```

---

## 📦 API 参数详解

### Adzuna API URL 结构

```
https://api.adzuna.com/v1/api/jobs/{country}/search/{page}
```

### 查询参数

| 参数 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `app_id` | ✅ | 应用 ID | `a1b2c3d4` |
| `app_key` | ✅ | 应用密钥 | `e5f6g7h8...` |
| `results_per_page` | ❌ | 每页数量 (最大 50) | `50` |
| `what` | ❌ | 搜索关键词 | `software engineer` |
| `where` | ❌ | 搜索地点 | `London` |
| `category` | ❌ | 行业分类 | `it-jobs` |
| `salary_min` | ❌ | 最低薪资 | `50000` |
| `contract_type` | ❌ | 合同类型 | `full_time` |

### 支持的国家代码

| 代码 | 国家 |
|------|------|
| `gb` | 英国 |
| `us` | 美国 |
| `de` | 德国 |
| `fr` | 法国 |
| `nl` | 荷兰 |
| `ie` | 爱尔兰 |
| `es` | 西班牙 |
| `it` | 意大利 |
| `au` | 澳大利亚 |
| `nz` | 新西兰 |
| `sg` | 新加坡 |
| `in` | 印度 |
| `za` | 南非 |
| `br` | 巴西 |
| `ca` | 加拿大 |

---

## 🔄 数据处理流程

### 1. API 响应解析

```typescript
interface AdzunaJob {
  id: string;              // 职位唯一 ID
  title: string;           // 职位名称
  company: {
    display_name: string;  // 公司名
  };
  location: {
    display_name: string;  // 完整地址
    area: string[];        // 区域列表
  };
  description: string;     // 原始职位描述
  redirect_url: string;    // 申请链接
  salary_min?: number;     // 最低薪资
  salary_max?: number;     // 最高薪资
  contract_time?: string;  // 工作时间 (full_time/part_time)
  contract_type?: string;  // 合同类型
  created: string;         // 发布时间
  category?: {
    label: string;         // 分类名
    tag: string;           // 分类标签
  };
}
```

### 2. AI 结构化解析

使用 Kimi API 将原始描述拆分为三个部分：

```typescript
{
  description: "岗位职责...",    // 这个职位要做什么
  requirements: "任职要求...",   // 需要什么技能/经验
  benefits: "福利待遇..."        // 公司提供什么福利
}
```

**Prompt 示例**:
```
你是一个专业的职位描述解析器。请将原始的职位描述文本解析为结构化的三个部分：
1. 岗位职责 (description) - 该职位需要做什么
2. 任职要求 (requirements) - 需要什么技能、经验、学历
3. 福利待遇 (benefits) - 公司提供什么福利

如果原文中没有明确提到某个部分，就返回空字符串。
只返回 JSON 格式，不要其他内容。
```

### 3. 自动生成标签

**地区标签**:
- `global-jobs` (所有 API 职位)
- `region-europe` / `欧洲` (欧洲职位)
- `region-north-america` / `北美` (北美职位)
- `region-asia-pacific` / `亚太` (亚太职位)
- `region-middle-east` / `中东` (中东职位)

**城市标签**:
- `city-london` / `伦敦`
- `city-new-york` / `纽约`
- `city-singapore` / `新加坡`
- 等等...

**特殊标签**:
- `remote` / `远程` (如果地点包含 "Remote")

### 4. 数据库存储

```typescript
await prisma.jobs.create({
  data: {
    slug: `adzuna-${job.id}`,           // 唯一标识
    title: job.title,                    // 职位名称
    description: parsed.description,     // 岗位职责
    requirements: parsed.requirements,   // 任职要求
    benefits: parsed.benefits,           // 福利待遇
    location: fullLocation,              // 完整地点
    city: city,                          // 城市名
    country: country.toUpperCase(),      // 国家代码
    salaryMin: job.salary_min,           // 最低薪资
    salaryMax: job.salary_max,           // 最高薪资
    employmentType: 'FULL_TIME',         // 工作类型
    applyUrl: job.redirect_url,          // 申请链接
    status: 'ACTIVE',                    // 状态
    companyId: COMPANY_ID,               // 关联公司
    authorId: AUTHOR_ID,                 // 作者
    keywords: globalTags                 // 标签数组
  }
});
```

---

## ⚠️ 注意事项

### 1. API 限流

- **Adzuna**: 免费版每秒最多 5 次请求
- **Kimi AI**: 根据套餐限制，建议每次请求间隔 500ms

**解决方案**:
```typescript
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 在循环中添加延迟
await sleep(500); // AI 解析间隔
await sleep(2000); // 批量同步间隔
```

### 2. 数据去重

使用 `slug: adzuna-{job.id}` 确保唯一性，Prisma 会自动处理重复数据。

### 3. 错误处理

```typescript
try {
  // 同步逻辑
} catch (error: any) {
  if (!error.message.includes('Unique constraint')) {
    console.error(`Failed to save job ${job.id}:`, error.message);
  }
}
```

### 4. 频率控制建议

| 操作 | 建议间隔 |
|------|----------|
| 单次 API 调用 | 200ms |
| AI 解析 | 500ms |
| 批量同步 (不同关键词) | 2000ms |
| 批量同步 (不同国家) | 3000ms |

---

## 📈 监控与维护

### 日志记录

```typescript
console.log(`Adzuna (${country}): 获取到 ${data.results.length} 个职位`);
console.log(`Adzuna: 新增 ${savedCount} 个职位`);
```

### 同步统计

查看数据库 `jobs` 表：
```sql
-- 查看 Adzuna 职位总数
SELECT COUNT(*) FROM jobs WHERE slug LIKE 'adzuna-%';

-- 按国家统计
SELECT country, COUNT(*) FROM jobs WHERE slug LIKE 'adzuna-%' GROUP BY country;

-- 按创建时间查看每日新增
SELECT DATE(created_at), COUNT(*) FROM jobs WHERE slug LIKE 'adzuna-%' GROUP BY DATE(created_at) ORDER BY 1 DESC;
```

---

## 🛠️ 扩展建议

### 1. 定时任务同步

使用 Vercel Cron 或 GitHub Actions 定时执行：

```yaml
# .github/workflows/sync-jobs.yml
name: Sync Adzuna Jobs

on:
  schedule:
    - cron: '0 2 * * *'  # 每天 UTC 2:00

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npx tsx src/lib/sync-overseas-jobs.ts
```

### 2. 添加更多数据源

参考 `src/lib/job-api-aggregator.ts`，可以添加：
- Jooble API
- TheMuse API
- Indeed API (需企业版)
- LinkedIn API (需审批)

### 3. 智能去重

在保存前检查相似职位：
```typescript
// 检查是否已存在相似职位
const existing = await prisma.jobs.findFirst({
  where: {
    title: { contains: job.title },
    companyId,
    location: { contains: city }
  }
});

if (!existing) {
  // 保存新职位
}
```

### 4. 质量过滤

```typescript
// 过滤低质量职位
if (!job.description || job.description.length < 100) {
  console.log(`跳过低质量职位 ${job.id}`);
  continue;
}

// 过滤特定关键词
const excludeKeywords = ['adult', 'casino', 'gambling'];
if (excludeKeywords.some(k => job.title.toLowerCase().includes(k))) {
  continue;
}
```

---

## 📝 完整代码示例

### 管理后台同步按钮

```tsx
// src/app/[locale]/admin/jobs/page.tsx
async function syncAdzunaJobs() {
  const res = await fetch('/api/admin/sync-adzuna', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bulk: true }),
  });
  
  const result = await res.json();
  
  if (result.success) {
    toast.success(`成功同步 ${result.count} 个职位`);
  } else {
    toast.error(`同步失败：${result.error}`);
  }
}

return (
  <button onClick={syncAdzunaJobs}>
    同步 Adzuna 海外职位
  </button>
);
```

---

## ✅ 检查清单

在开始同步前，确保：

- [ ] Adzuna API 凭证已配置
- [ ] Kimi API Key 已配置
- [ ] 公司和作者 ID 已获取
- [ ] 数据库连接正常
- [ ] 测试单次同步成功
- [ ] 了解 API 限流规则
- [ ] 设置适当的延迟间隔

---

## 🆘 常见问题

**Q: 同步后职位不显示？**
A: 检查 `status` 字段是否为 `ACTIVE`，并确保前端查询包含该状态。

**Q: AI 解析失败怎么办？**
A: 代码已处理降级，会返回原始描述的前 500 字。

**Q: 如何删除已同步的职位？**
A: 调用 `DELETE /api/admin/clear-adzuna-jobs` 端点。

**Q: 可以自定义同步的国家和城市吗？**
A: 修改 `src/lib/sync-overseas-jobs.ts` 中的 `COUNTRIES` 数组。

---

**文档版本**: 2026-04-29  
**维护者**: JobQuip 开发团队
