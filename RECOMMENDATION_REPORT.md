# 推荐系统开发总结报告

## 任务完成清单

### ✅ 已完成的功能

1. **首页"为您推荐"职位显示**
   - 文件: `src/components/recommendation-section.tsx`
   - 已集成到首页 `src/app/page.tsx`

2. **推荐算法（简单版本）**
   - 基于用户浏览历史（localStorage记录）
   - 基于用户申请历史（API获取）
   - 基于用户技能标签匹配职位要求
   - 文件: `src/lib/recommendations.ts`

3. **推荐API**
   - 端点: `/api/recommendations`
   - 支持 GET 和 POST 方法
   - 支持分页和技能参数
   - 文件: `src/app/api/recommendations/route.ts`

4. **推荐组件**
   - 组件名: `RecommendationSection`
   - 支持加载状态、错误处理、空状态
   - 显示匹配度和推荐理由
   - 响应式设计

5. **未登录用户处理**
   - 显示热门职位作为推荐
   - 显示登录提示

6. **推荐排序**
   - 算法: 匹配度(70%) + 发布时间权重(30%)
   - 新发布职位额外加分
   - 热门职位额外加分

---

## 创建/修改的文件列表

### 新文件

| 文件路径 | 大小 | 说明 |
|---------|------|------|
| `src/lib/recommendations.ts` | ~7.5KB | 推荐算法核心逻辑 |
| `src/components/recommendation-section.tsx` | ~10KB | 推荐组件（首页使用） |
| `src/components/job-view-tracker.tsx` | ~0.7KB | 浏览追踪组件 |
| `src/app/api/recommendations/route.ts` | ~5.3KB | 推荐 API 路由 |
| `RECOMMENDATION_TEST.md` | ~3.2KB | 测试指南文档 |

### 修改的文件

| 文件路径 | 修改内容 |
|---------|---------|
| `src/app/page.tsx` | 添加 RecommendationSection 组件导入和引用 |
| `src/app/jobs/[slug]/page.tsx` | 添加 JobViewTracker 组件记录浏览历史 |

---

## 推荐算法说明

### 1. 数据收集

#### 客户端 (localStorage)
```typescript
interface UserBehaviorData {
  viewedJobs: string[];    // 浏览的职位ID列表（最多50个）
  viewedAt: Record<string, number>;  // 浏览时间戳
  appliedJobs: string[];   // 申请的职位ID列表
  skills: string[];        // 提取的技能标签（最多20个）
  lastUpdated: number;
}
```

#### 服务端 (Prisma)
- 用户资料中的技能标签 (`user_profiles.skills`)
- 用户申请历史 (`job_applications`)

### 2. 技能标签提取

从职位标题和描述中提取以下关键词：
- **前端**: JavaScript, React, Vue, Angular, TypeScript
- **后端**: Node.js, Python, Java, Go, Rust, PHP
- **移动端**: Flutter, React Native, Swift, Kotlin
- **数据库**: SQL, MongoDB, Redis
- **运维**: Docker, Kubernetes, AWS, Azure
- **其他**: AI, Blockchain, Product Manager, Designer

### 3. 匹配度计算

```
总分 = 技能匹配(最高40分) 
     + 浏览历史(最高20分) 
     + 职位新鲜度(最高20分) 
     + 热门加分(最高10分)
     - 已申请惩罚(-100分)
```

#### 详细规则
| 因子 | 权重 | 说明 |
|-----|------|------|
| 技能匹配 | 8分/个 | 最多5个技能，共40分 |
| 浏览历史 | 2分/个 | 最近10个浏览记录 |
| 3天内发布 | 20分 | 新职位额外加分 |
| 7天内发布 | 10分 | 本周职位加分 |
| 热门职位 | 10分 | isFeatured=true |
| 已申请 | -100分 | 排除已申请职位 |

### 4. 排序算法

```
推荐权重 = 匹配度 × 0.7 + 时间衰减因子 × 30

时间衰减因子 = exp(-天数/7)  // 7天半衰期
```

示例：
- 3天前发布的职位：时间权重 = exp(-3/7) × 30 ≈ 21.3
- 7天前发布的职位：时间权重 = exp(-1) × 30 ≈ 11.0

### 5. 推荐模式

#### 个性化模式（用户已登录或有技能标签）
1. 获取用户技能标签
2. 计算每个职位的匹配度
3. 计算推荐权重
4. 按权重排序返回

#### 热门模式（未登录用户）
1. 获取 featured 职位
2. 获取最新发布的职位
3. 混合排序返回

---

## 技术实现细节

### 浏览历史追踪

在职位详情页面添加 `JobViewTracker` 组件：
- 延迟 2 秒后记录（确保用户真实浏览）
- 24小时内不重复记录同一职位
- 自动提取技能标签并合并

### API 设计

```http
GET /api/recommendations?limit=6&offset=0&skills=React,TypeScript

Response:
{
  "jobs": [...],
  "total": 100,
  "isPersonalized": true,
  "userSkills": ["React", "TypeScript"]
}
```

### 组件 Props

```typescript
interface RecommendationSectionProps {
  limit?: number;      // 默认 6
  className?: string;  // 额外的 CSS 类
}
```

---

## 测试建议

### 单元测试（建议添加）

```typescript
// 测试技能提取
expect(extractSkillsFromJob({ title: "React Developer", ... }))
  .toContain("React");

// 测试匹配度计算
expect(calculateMatchScore(job, { skills: ["React"] }))
  .toHaveProperty("score", expect.any(Number));
```

### 集成测试

1. **端到端测试** (Playwright/Cypress)
   - 未登录用户看到热门职位
   - 登录后看到个性化推荐
   - 浏览职位后推荐更新

2. **API 测试**
   - 带认证请求返回个性化结果
   - 无认证请求返回热门职位
   - 参数验证（limit, offset, skills）

### 性能测试

- API 响应时间 < 500ms
- 支持并发 100+ 请求
- localStorage 操作不影响页面性能

---

## 未来优化方向

1. **协同过滤**
   - 基于相似用户的浏览/申请历史推荐

2. **内容推荐**
   - 基于职位描述的 TF-IDF 相似度

3. **机器学习**
   - 训练点击率预测模型
   - A/B 测试不同算法效果

4. **实时推荐**
   - 使用 WebSocket 推送新职位
   - 基于当前浏览行为实时调整

5. **多维度排序**
   - 薪资匹配度
   - 地理位置距离
   - 公司规模偏好

---

## 监控指标

建议添加以下监控：

| 指标 | 目标值 |
|-----|-------|
| 推荐点击率 | > 10% |
| 个性化覆盖率 | > 70% |
| API P99 延迟 | < 500ms |
| 推荐多样性 | > 5 个不同类别 |

---

## 总结

推荐系统已实现核心功能：
- ✅ 基于技能标签的个性化推荐
- ✅ 基于浏览历史的行为追踪
- ✅ 基于申请历史的智能过滤
- ✅ 未登录用户的降级方案
- ✅ 匹配度 + 时间的复合排序

系统架构简洁，易于扩展，为后续引入更复杂的机器学习算法奠定了基础。
