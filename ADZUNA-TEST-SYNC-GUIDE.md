# Adzuna 测试同步完整流程指南

**目标**: 在网站上执行一次安全的 Adzuna 海外职位测试同步

---

## 📋 同步流程总览

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. 管理后台触发 │ ──→ │ 2. API 调用获取 │ ──→ │ 3. AI 解析处理  │
│   同步按钮       │     │   Adzuna 数据    │     │   职位描述      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         ↓                       ↓                       ↓
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 6. 前台展示     │ ←─  │ 5. 前端查询     │ ←─  │ 4. 存入数据库   │
│   用户可见       │     │   职位列表       │     │   jobs 表        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🔧 方案 1：管理后台添加同步按钮（推荐）

### 步骤 1：在管理后台首页添加同步卡片

**文件**: `src/app/[locale]/admin/page.tsx`

在 `quickActions` 数组后添加同步功能：

```tsx
// 在现有的 quickActions 后面添加
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8">
  <h2 className="text-lg font-bold text-gray-900 mb-4">海外职位同步</h2>
  
  <div className="space-y-4">
    {/* 单次同步 */}
    <button
      onClick={async () => {
        const res = await fetch('/api/admin/sync-adzuna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: 'software engineer',
            location: 'London',
            bulk: false
          }),
        });
        const result = await res.json();
        if (result.success) {
          alert(`✅ 成功同步 ${result.count} 个职位`);
          window.location.reload();
        } else {
          alert(`❌ 同步失败：${result.error}`);
        }
      }}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
    >
      <Globe className="w-5 h-5" />
      测试同步（伦敦 - 软件工程师）
    </button>
    
    {/* 批量同步 */}
    <button
      onClick={async () => {
        if (!confirm('将同步英国 3 城市×3 关键词≈450 个职位，耗时约 3-5 分钟，确定继续？')) return;
        
        const res = await fetch('/api/admin/sync-adzuna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bulk: true }),
        });
        const result = await res.json();
        if (result.success) {
          alert(`✅ 批量同步完成，新增 ${result.count} 个职位`);
          window.location.reload();
        } else {
          alert(`❌ 同步失败：${result.error}`);
        }
      }}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
    >
      <Briefcase className="w-5 h-5" />
      批量同步（英国区）
    </button>
    
    <p className="text-xs text-gray-500 text-center">
      ⚠️ 首次同步建议先测试，确认无误后再批量同步
    </p>
  </div>
</div>
```

### 步骤 2：部署到 Vercel

```bash
cd /home/admin/openclaw/workspace/jobs-platform
git add -A
git commit -m "feat: 添加 Adzuna 同步按钮到管理后台"
git push origin main
```

Vercel 会自动构建并部署（约 2-3 分钟）。

---

## 🎯 方案 2：直接调用 API（快速测试）

### 方式 A：使用测试端点

**访问 URL**:
```
https://jobquip.com/api/test-adzuna-direct
```

**预期响应**:
```json
{
  "success": true,
  "count": 3506,
  "mean": 87221.9,
  "results": [
    {
      "title": "Director of Software Engineering",
      "company": "Capital One",
      "location": "London, UK",
      "salary_min": 84620.76,
      "salary_max": 84620.76
    }
  ]
}
```

### 方式 B：使用 cURL 命令

```bash
# 测试同步（单次）
curl -X POST https://jobquip.com/api/admin/sync-adzuna \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=你的管理员会话" \
  -d '{
    "keyword": "software engineer",
    "location": "London",
    "bulk": false
  }'
```

**注意**: 需要先登录管理后台获取会话 cookie

---

## 🖥️ 方案 3：本地执行脚本（最安全）

### 步骤 1：本地运行同步脚本

```bash
cd /home/admin/openclaw/workspace/jobs-platform

# 运行测试同步（仅伦敦）
npx tsx src/lib/sync-overseas-jobs.ts
```

### 步骤 2：查看输出日志

```
🌍 开始抓取海外职位...

📍 抓取 英国 (gb)...
  ✅ software engineer in London: 50 个
  ✅ frontend developer in London: 48 个
  ✅ backend developer in London: 45 个

✅ 海外职位抓取完成！总计新增 143 个职位
```

### 步骤 3：推送到 Vercel

```bash
git add -A
git commit -m "sync: 导入 143 个英国海外职位"
git push origin main
```

---

## 📊 数据导入后的展示流程

### 1. 数据库存储

同步的职位会存入 `jobs` 表：

```sql
-- 查看刚同步的职位
SELECT id, title, company_id, location, city, country, status, created_at
FROM jobs
WHERE slug LIKE 'adzuna-%'
ORDER BY created_at DESC
LIMIT 10;
```

**存储字段**:
| 字段 | 说明 | 示例 |
|------|------|------|
| `slug` | 唯一标识 | `adzuna-5706862897` |
| `title` | 职位名称 | `Software Engineer` |
| `description` | 岗位职责（AI 解析） | `负责开发和维护...` |
| `requirements` | 任职要求（AI 解析） | `本科及以上学历...` |
| `benefits` | 福利待遇（AI 解析） | `弹性工作、医保...` |
| `location` | 完整地点 | `London, UK` |
| `city` | 城市 | `London` |
| `country` | 国家代码 | `GB` |
| `salaryMin/Max` | 薪资范围 | `70000-90000` |
| `employmentType` | 工作类型 | `FULL_TIME` |
| `applyUrl` | 申请链接 | Adzuna 跳转链接 |
| `status` | 状态 | `ACTIVE` |
| `companyId` | 关联公司 | 预设的 Adzuna 公司 ID |
| `keywords` | 标签数组 | `['global-jobs', 'region-europe', '伦敦']` |

### 2. 前台展示

#### 首页展示
**文件**: `src/app/[locale]/page.tsx`

首页会自动显示最新职位（包括 Adzuna 同步的）：

```tsx
const { featuredJobs, latestJobs } = await getHomePageData();
// latestJobs 包含所有 ACTIVE 状态的职位
```

#### 职位列表页
**URL**: `https://jobquip.com/zh/jobs`

**文件**: `src/app/[locale]/jobs/page.tsx`

自动展示所有职位，支持筛选：
- 地区筛选：全球职位
- 城市筛选：伦敦、纽约等
- 薪资筛选

#### 职位详情页
**URL**: `https://jobquip.com/zh/jobs/adzuna-5706862897`

**文件**: `src/app/[locale]/jobs/[slug]/page.tsx`

展示完整信息：
- 职位名称
- 公司名称
- 地点（带地图）
- 薪资范围
- 岗位职责（AI 解析）
- 任职要求（AI 解析）
- 福利待遇（AI 解析）
- "立即申请"按钮（跳转到 Adzuna）

---

## ✅ 完整测试流程（推荐）

### 第 1 步：管理后台添加同步按钮（5 分钟）

1. 编辑 `src/app/[locale]/admin/page.tsx`
2. 添加同步按钮代码（见上方）
3. 提交并推送到 Git

```bash
cd /home/admin/openclaw/workspace/jobs-platform
git add src/app/[locale]/admin/page.tsx
git commit -m "feat: 添加 Adzuna 同步功能"
git push origin main
```

### 第 2 步：等待 Vercel 部署（2-3 分钟）

访问 https://vercel.com/dashboard 查看部署进度

### 第 3 步：登录管理后台

```
https://jobquip.com/zh/admin
```

### 第 4 步：点击"测试同步"按钮

- 点击 **"测试同步（伦敦 - 软件工程师）"**
- 等待约 30 秒
- 查看成功提示

### 第 5 步：验证数据

**管理后台查看**:
```
https://jobquip.com/zh/admin/jobs
```
应该能看到新同步的职位，标题包含 "adzuna" 前缀

**前台查看**:
```
https://jobquip.com/zh/jobs
```
筛选条件选择 "全球职位" 或地点 "London"

### 第 6 步：检查 AI 解析质量

随机点开一个职位详情，检查：
- ✅ 岗位职责是否结构化
- ✅ 任职要求是否清晰
- ✅ 福利待遇是否提取正确

---

## 🔍 故障排查

### 问题 1：点击按钮无反应

**检查**:
1. 浏览器控制台是否有错误
2. 是否已登录管理后台
3. 用户角色是否为 ADMIN

**解决**:
```sql
-- 检查用户角色
SELECT id, name, email, role FROM users WHERE email = '你的管理员邮箱';
```

### 问题 2：同步失败，报错 "无权操作"

**原因**: 未登录或角色不对

**解决**: 重新登录管理后台

### 问题 3：同步成功但前台看不到

**检查**:
```sql
-- 查看职位状态
SELECT id, title, status FROM jobs WHERE slug LIKE 'adzuna-%' ORDER BY created_at DESC;
```

**解决**: 确保 `status = 'ACTIVE'`

### 问题 4:AI 解析失败

**检查 Vercel 日志**:
```bash
vercel logs jobquip.com --follow | grep "AI"
```

**可能原因**: Kimi API Key 过期或限额

**解决**: 更新 `.env.local` 中的 `KIMI_API_KEY`

---

## 📈 同步后监控

### 数据库查询

```sql
-- 查看每日新增
SELECT DATE(created_at) as date, COUNT(*) as new_jobs
FROM jobs 
WHERE slug LIKE 'adzuna-%'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 查看国家分布
SELECT country, COUNT(*) as job_count
FROM jobs 
WHERE slug LIKE 'adzuna-%'
GROUP BY country;

-- 查看城市分布
SELECT city, COUNT(*) as job_count
FROM jobs 
WHERE slug LIKE 'adzuna-%'
GROUP BY city
ORDER BY job_count DESC
LIMIT 20;
```

### 前台流量监控

访问 Vercel Analytics 查看：
- 职位详情页访问量
- 申请链接点击率
- 用户来源地区

---

## 🎯 最佳实践建议

### 首次同步（测试阶段）
1. **只同步 1 个城市** - London
2. **只同步 1 个关键词** - software engineer
3. **检查数据质量** - AI 解析、标签、薪资
4. **验证前台展示** - 列表、详情、筛选

### 正式同步（生产阶段）
1. **分批次同步** - 每天 1 个国家，避免一次性导入太多
2. **定时同步** - 使用 Vercel Cron 每天凌晨同步
3. **去重检查** - 定期清理过期职位
4. **质量监控** - 检查 AI 解析准确率

### 长期维护
1. **每周清理** - 删除超过 30 天的职位
2. **质量反馈** - 收集用户对 AI 解析的反馈
3. **API 监控** - 监控 Adzuna 和 Kimi 的调用次数
4. **成本优化** - 根据效果调整同步频率

---

## 📝 快速检查清单

执行同步前确认：

- [ ] API 凭证已配置（`.env.local`）
- [ ] 管理后台可以正常访问
- [ ] 管理员账号可以登录
- [ ] 数据库连接正常
- [ ] 已备份重要数据（可选）
- [ ] 了解回滚方案

执行同步后验证：

- [ ] 数据库有新数据
- [ ] 管理后台可以看到
- [ ] 前台可以浏览
- [ ] AI 解析质量可接受
- [ ] 申请链接可以跳转
- [ ] 筛选功能正常

---

**文档版本**: 2026-04-29  
**预计耗时**: 首次测试 10-15 分钟  
**风险等级**: 🟢 低（可安全执行）
