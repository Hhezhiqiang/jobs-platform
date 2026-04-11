# 推荐系统测试指南

## 功能概述

推荐系统基于以下维度为用户提供个性化职位推荐：
1. **用户技能标签匹配** - 基于用户资料中的技能标签
2. **浏览历史** - 记录用户浏览过的职位类型
3. **申请历史** - 排除已申请的职位
4. **职位新鲜度** - 优先推荐新发布的职位
5. **热门职位** - 未登录用户显示热门职位

## 文件结构

```
src/
├── lib/
│   └── recommendations.ts          # 推荐算法工具函数
├── components/
│   ├── recommendation-section.tsx  # 推荐组件（首页使用）
│   └── job-view-tracker.tsx        # 浏览追踪组件
└── app/
    └── api/
        └── recommendations/
            └── route.ts            # 推荐 API
```

## 测试步骤

### 1. 未登录用户测试

**场景**: 用户首次访问首页

**预期结果**:
- [ ] 显示 "🔥 热门职位" 标题
- [ ] 显示 6 个职位卡片
- [ ] 显示 "登录后可获得更精准的职位推荐" 提示
- [ ] 点击职位进入详情页

```bash
# 测试 API
curl http://localhost:3000/api/recommendations?limit=6
```

### 2. 浏览历史测试

**场景**: 用户浏览多个职位

**步骤**:
1. 访问职位列表页 `/jobs`
2. 点击任意职位进入详情页
3. 停留超过 2 秒
4. 返回首页

**预期结果**:
- [ ] localStorage 中存储浏览记录
- [ ] 再次访问时推荐类似职位

```javascript
// 浏览器控制台检查
const data = JSON.parse(localStorage.getItem('job_recommendation_data'));
console.log(data.viewedJobs); // 查看浏览记录
console.log(data.skills);     // 查看提取的技能标签
```

### 3. 登录用户测试

**场景**: 已登录用户查看推荐

**前置条件**:
- 用户已登录
- 用户资料中有技能标签

**预期结果**:
- [ ] 显示 "✨ 为您推荐" 标题
- [ ] 显示 "个性化" 标签
- [ ] 显示匹配度百分比
- [ ] 显示推荐理由（如："技能匹配: React, TypeScript"）
- [ ] 排除已申请的职位

```bash
# 测试带用户技能的 API
curl http://localhost:3000/api/recommendations?limit=6 \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### 4. 技能匹配测试

**场景**: 验证技能匹配算法

**步骤**:
1. 在用户资料中添加技能标签（如：React, TypeScript, Node.js）
2. 刷新首页

**预期结果**:
- [ ] 推荐包含这些技能的职位
- [ ] 匹配度高于 60%

### 5. API 测试

#### 5.1 获取推荐（无参数）

```bash
curl http://localhost:3000/api/recommendations
```

**响应示例**:
```json
{
  "jobs": [
    {
      "id": "...",
      "title": "高级前端工程师",
      "company": { "name": "..." },
      "matchScore": 85,
      "matchReasons": ["技能匹配: React, TypeScript", "新发布职位"]
    }
  ],
  "total": 100,
  "isPersonalized": false
}
```

#### 5.2 获取推荐（带技能参数）

```bash
curl "http://localhost:3000/api/recommendations?limit=6&skills=React,TypeScript,Node.js"
```

**预期结果**:
- `isPersonalized: true`
- `userSkills: ["React", "TypeScript", "Node.js"]`
- 职位按匹配度排序

#### 5.3 分页测试

```bash
curl "http://localhost:3000/api/recommendations?limit=3&offset=0"
curl "http://localhost:3000/api/recommendations?limit=3&offset=3"
```

### 6. 边界条件测试

| 场景 | 预期结果 |
|------|----------|
| 无活跃职位 | 显示空状态提示 |
| 用户已申请所有推荐职位 | 显示空状态或热门职位 |
| 技能标签为空 | 降级为热门职位推荐 |
| 网络错误 | 显示重试按钮 |
| localStorage 不可用 | 静默失败，不影响功能 |

### 7. 性能测试

```bash
# 并发请求测试
ab -n 1000 -c 10 http://localhost:3000/api/recommendations?limit=6
```

**预期结果**:
- 响应时间 < 500ms
- 无内存泄漏
- 数据库连接正常

## 调试技巧

### 查看推荐算法日志

```javascript
// 浏览器控制台
const data = JSON.parse(localStorage.getItem('job_recommendation_data'));
console.table({
  浏览职位数: data.viewedJobs.length,
  技能标签: data.skills.join(', '),
  已申请: data.appliedJobs.length,
  最后更新: new Date(data.lastUpdated).toLocaleString()
});
```

### 模拟不同用户

```javascript
// 清除浏览历史
localStorage.removeItem('job_recommendation_data');
location.reload();
```

### 检查 API 响应

打开浏览器开发者工具 → Network → 找到 `recommendations` 请求

## 常见问题

### Q: 推荐职位不更新？
A: 清除 localStorage 或等待浏览更多职位

### Q: 匹配度一直很低？
A: 检查用户资料中的技能标签是否正确设置

### Q: 已申请职位还显示？
A: 刷新页面，API 会重新获取申请历史

### Q: 未登录用户看到空推荐？
A: 检查数据库中是否有活跃职位

## 监控指标

- 推荐点击率
- 个性化推荐 vs 热门推荐的效果对比
- API 响应时间
- 推荐覆盖率（有推荐的用户比例）
