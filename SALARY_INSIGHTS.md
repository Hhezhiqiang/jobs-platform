# 薪资洞察分析功能 (Salary Insights)

## 功能概述
基于平台真实职位数据的薪资分析报告页面，提供全面的薪资数据可视化和智能薪资估算功能。

## 创建的文件列表

### 页面文件
- `src/app/salary-insights/page.tsx` - 主页面组件
- `src/app/salary-insights/layout.tsx` - 页面布局及 SEO metadata

### 组件文件
- `src/app/salary-insights/components/overview-cards.tsx` - 统计概览卡片
- `src/app/salary-insights/components/filter-section.tsx` - 行业/城市筛选器
- `src/app/salary-insights/components/salary-calculator.tsx` - 薪资计算器
- `src/app/salary-insights/components/salary-schema.tsx` - SEO Schema 组件

### API 路由
- `src/app/api/salary-insights/route.ts` - 获取薪资统计数据
- `src/app/api/salary-insights/calculator/route.ts` - 薪资估算接口

## 实现的功能点

### 1. 数据展示
- **各行业平均薪资对比**：柱状图展示前10个行业的平均薪资水平
- **各城市薪资分布**：柱状图展示前12个城市的平均薪资和中位数
- **薪资趋势图**：折线图展示近6个月的薪资变化趋势
- **职位类型薪资对比**：横向柱状图展示不同职位类型的薪资对比

### 2. 数据聚合
从现有 Job 数据中聚合计算：
- 平均薪资 = (salaryMin + salaryMax) / 2
- 按行业、城市、职位类型分组统计
- 近6个月趋势数据（按月份分组）
- 总体统计：职位总数、平均薪资、中位数、薪资区间

### 3. 交互功能
- **行业筛选**：点击行业标签过滤数据
- **城市筛选**：点击城市标签过滤数据
- **薪资计算器**：
  - 输入职位名称
  - 选择工作经验（0-1年、1-3年、3-5年、5-8年、8-10年、10年+）
  - 可选输入城市
  - 显示预估薪资、薪资范围、置信度、参考样本数

### 4. SEO 优化
- **Title & Meta**: 针对薪资分析关键词优化
- **Salary Schema**: 使用 schema.org/Occupation 结构化数据
- **Dataset Schema**: 标注数据集信息
- **FAQ Schema**: 常见问题结构化数据
- **Breadcrumb Schema**: 面包屑导航结构化数据

## 技术栈
- Next.js 14 App Router
- React + TypeScript
- Recharts (图表库)
- Tailwind CSS
- Prisma (数据聚合)

## 访问路径
- 页面：`/salary-insights`
- API：`/api/salary-insights` (GET)
- API：`/api/salary-insights/calculator` (POST)

## 测试建议

### 1. 功能测试
- [ ] 访问 `/salary-insights` 页面正常加载
- [ ] 各图表正确显示数据
- [ ] 行业/城市筛选器正常工作
- [ ] 薪资计算器能够正确估算薪资
- [ ] 筛选器与图表数据联动正常

### 2. API 测试
```bash
# 获取薪资统计数据
curl http://localhost:3000/api/salary-insights

# 薪资计算器
curl -X POST http://localhost:3000/api/salary-insights/calculator \
  -H "Content-Type: application/json" \
  -d '{"jobTitle":"前端工程师","experience":"3-5","city":"北京"}'
```

### 3. SEO 测试
- [ ] 查看页面源码确认 meta tags 正确
- [ ] 使用 Google Rich Results Test 验证 Schema
- [ ] 检查页面标题和描述是否正确显示

### 4. 响应式测试
- [ ] 桌面端 (1920x1080)
- [ ] 平板端 (768x1024)
- [ ] 移动端 (375x667)

### 5. 性能测试
- [ ] 页面加载时间 < 3秒
- [ ] API 响应时间 < 1秒
- [ ] 图表渲染流畅

## 可能的改进方向
1. 添加更多筛选维度（公司规模、学历要求等）
2. 实现数据导出功能（CSV/Excel）
3. 添加薪资对比功能（不同城市/行业对比）
4. 实现实时数据更新（WebSocket）
5. 添加薪资预测功能（基于历史趋势）
