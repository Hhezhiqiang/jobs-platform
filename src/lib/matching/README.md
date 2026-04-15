# 文化匹配度系统

## 概述

文化匹配度系统帮助求职者找到与自己期望工作文化相符的职位，同时也帮助公司展示其文化特色。

## 核心功能

1. **匹配度计算** - 根据用户期望标签与公司共识标签计算匹配度（0-100分）
2. **用户偏好管理** - 用户可设置期望的公司文化、薪资范围、工作地点等
3. **职位推荐** - 根据用户偏好推荐职位，并按文化匹配度排序
4. **文化标签管理** - 公司员工可以为公司添加文化标签

## 文件结构

```
src/
├── lib/matching/
│   ├── culture-match.ts    # 匹配度计算算法
│   └── types.ts            # 类型定义
├── components/matching/
│   ├── culture-match-badge.tsx    # 匹配度徽章组件
│   └── job-preferences-form.tsx   # 求职偏好表单
├── hooks/
│   └── use-culture-match.ts       # 文化匹配 Hook
└── app/api/
    ├── user/job-preferences/route.ts    # 用户偏好API
    ├── jobs/recommended/route.ts        # 推荐职位API
    ├── jobs/[id]/culture-match/route.ts # 职位匹配度API
    └── companies/[id]/culture-tags/route.ts  # 公司标签管理API
```

## API 接口

### 1. 用户求职偏好

**GET /api/user/job-preferences**
获取当前用户的求职偏好

**POST /api/user/job-preferences**
更新用户求职偏好
```json
{
  "cultureTags": ["扁平管理", "技术驱动"],
  "salaryMin": 300,
  "salaryMax": 500,
  "employmentTypes": ["FULL_TIME"],
  "locations": ["北京", "上海"],
  "remotePreference": "HYBRID",
  "experienceLevel": "MID"
}
```

### 2. 推荐职位

**GET /api/jobs/recommended?page=1&limit=20**

返回按文化匹配度排序的职位列表，包含匹配度信息：
```json
{
  "jobs": [
    {
      "id": "...",
      "title": "高级前端工程师",
      "cultureMatch": {
        "score": 85,
        "isCultureFit": true,
        "level": "文化契合",
        "color": "#3b82f6",
        "matchedTags": [
          {"tagName": "扁平管理", "voteCount": 5, "weight": 2}
        ]
      }
    }
  ],
  "hasPreferences": true
}
```

### 3. 职位文化匹配度

**GET /api/jobs/[id]/culture-match**

获取指定职位的文化匹配度详情：
```json
{
  "jobId": "...",
  "hasMatch": true,
  "matchResult": {
    "score": 85,
    "isCultureFit": true,
    "level": "文化契合",
    "matchedTags": [...],
    "unmatchedTags": [...]
  },
  "companyTags": [
    {"tagName": "扁平管理", "voteCount": 5},
    {"tagName": "技术驱动", "voteCount": 3}
  ]
}
```

### 4. 公司文化标签管理

**GET /api/companies/[id]/culture-tags**
获取公司文化标签列表

**POST /api/companies/[id]/culture-tags**
添加/投票标签
```json
{
  "tagName": "扁平管理",
  "action": "vote"  // "vote" | "remove"
}
```

## 匹配度算法

### 计算公式

```typescript
// 标签权重（认同人数越多，权重越高）
const VOTE_WEIGHTS = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 1.8,
  5: 2.0,  // 5人及以上
};

// 匹配度 = 50 + (匹配权重 / 总权重) * 50
// 结果范围：0-100
```

### 匹配等级

| 分数 | 等级 | 标签 |
|------|------|------|
| 90-100 | 完美契合 | 绿色 |
| 80-89 | 文化契合 | 蓝色（⭐标识）|
| 60-79 | 较为匹配 | 黄色 |
| <60 | 一般匹配 | 灰色 |

## 组件使用

### CultureMatchBadge - 匹配度徽章

```tsx
import { CultureMatchBadge } from "@/components/matching/culture-match-badge";

// 基础用法
<CultureMatchBadge 
  cultureMatch={{
    score: 85,
    isCultureFit: true,
    level: "文化契合",
    color: "#3b82f6",
    matchedTags: [{ tagName: "扁平管理", voteCount: 5, weight: 2 }]
  }}
  size="md"
/>

// 尺寸选项: "sm" | "md" | "lg"
```

### CultureMatchCard - 匹配度详情卡片

```tsx
import { CultureMatchCard } from "@/components/matching/culture-match-badge";

<CultureMatchCard
  userTags={["扁平管理", "技术驱动"]}
  companyTags={[{ tagName: "扁平管理", voteCount: 5 }]}
  cultureMatch={cultureMatchData}
/>
```

### JobPreferencesForm - 求职偏好表单

```tsx
import { JobPreferencesForm } from "@/components/matching/job-preferences-form";

<JobPreferencesForm
  onSave={() => console.log("保存成功")}
  onCancel={() => console.log("取消")}
/>
```

## Hook 使用

### useCultureMatch

```tsx
import { useCultureMatch } from "@/hooks/use-culture-match";

function JobList() {
  const { 
    preferences, 
    recommendedJobs, 
    isLoading, 
    updatePreferences,
    fetchRecommendedJobs 
  } = useCultureMatch();

  useEffect(() => {
    fetchRecommendedJobs();
  }, []);

  return (
    <div>
      {recommendedJobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

### useCompanyCultureTags

```tsx
import { useCompanyCultureTags } from "@/hooks/use-culture-match";

function CompanyTags({ companyId }) {
  const { tags, voteTag, unvoteTag } = useCompanyCultureTags(companyId);

  return (
    <div>
      {tags.map(tag => (
        <span key={tag.tagName}>
          {tag.tagName} ({tag.voteCount})
        </span>
      ))}
      <button onClick={() => voteTag("技术驱动")}>
        + 认同"技术驱动"
      </button>
    </div>
  );
}
```

## 数据库迁移

运行 Prisma 迁移以创建新表：

```bash
npx prisma migrate dev --name add_culture_matching
# 或
npx prisma db push
```

## 性能优化

1. **缓存匹配结果** - 推荐职位API使用5分钟内存缓存
2. **数据库索引** - 在 companyId 和 voteCount 上创建索引
3. **批量查询** - 使用 Promise.all 并行查询职位和标签

## 后续扩展建议

1. **机器学习优化** - 根据用户行为调整匹配算法权重
2. **实时更新** - WebSocket 推送匹配度变化
3. **标签推荐** - 根据用户行为推荐可能感兴趣的标签
4. **A/B测试** - 测试不同算法参数对申请转化率的影响
