# 全文搜索功能文档

## 功能概述

实现了基于 PostgreSQL 的全文搜索功能，支持职位标题、描述、公司名、地点的多字段搜索。

## 实现的功能点

### 1. 搜索页面 (`/search`)
- 路径：`/search?q=keyword`
- 支持分页、筛选条件
- 响应式布局设计

### 2. 搜索范围
- 职位标题 (权重: A)
- 职位描述 (权重: B)
- 公司名 (通过关联查询)
- 公司描述 (通过关联查询)
- 地点 (城市、详细地址)

### 3. 搜索建议
- 输入时实时显示建议
- 从职位标题匹配
- 从公司名匹配
- 从搜索历史匹配
- 支持键盘导航 (↑↓ 选择, Enter 确认, Esc 关闭)

### 4. 搜索历史 (localStorage)
- 自动保存用户搜索历史
- 最多保存 10 条记录
- 支持删除单条记录
- 支持清空全部历史

### 5. 热门搜索
- 基于搜索频次统计
- 显示前 N 个热门搜索词
- 支持时间段过滤（默认最近30天）

### 6. 筛选条件
- **城市**: 从数据库动态获取城市列表
- **职位类型**: 全职、兼职、合同制、实习、自由职业
- **薪资范围**: 10K以下、10K-20K、20K-30K、30K-50K、50K以上

### 7. 高亮显示
- 搜索结果中高亮匹配的关键词
- 支持职位标题、公司名、地点高亮
- 黄色背景高亮样式

### 8. 数据库优化
- PostgreSQL GIN 索引支持全文搜索
- `search_vector` 列存储 tsvector 数据
- 触发器自动更新搜索向量

## API 端点

### 1. 搜索职位
```
GET /api/search?q=keyword&city=xxx&type=xxx&minSalary=xxx&maxSalary=xxx&page=1&limit=20
```

### 2. 获取搜索建议
```
GET /api/search/suggestions?q=keyword&limit=10
```

### 3. 获取热门搜索
```
GET /api/search/hot?limit=10&days=30
```

### 4. 获取城市列表
```
GET /api/jobs/cities
```

## 组件列表

| 组件 | 路径 | 说明 |
|------|------|------|
| SearchBox | `src/components/search-box.tsx` | 搜索框组件，含建议、历史、热门 |
| SearchFilters | `src/components/search-filters.tsx` | 筛选条件组件 |
| SearchHistory | `src/components/search-history.tsx` | 搜索历史展示 |
| HotSearches | `src/components/hot-searches.tsx` | 热门搜索展示 |
| HighlightedText | `src/components/highlighted-text.tsx` | 高亮文本组件 |
| SearchPageClient | `src/app/search/search-page-client.tsx` | 搜索页面客户端组件 |

## 数据库表

### search_queries (搜索查询统计)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (CUID) | 主键 |
| query | String | 搜索词 |
| count | Int | 搜索次数 |
| lastSearched | DateTime | 最后搜索时间 |

## 配置说明

### localStorage Key
- `job_search_history`: 存储用户搜索历史

### 环境变量
无需额外配置，使用现有的 `DATABASE_URL` 即可。

## 测试建议

### 1. 功能测试
```bash
# 访问搜索页面
curl http://localhost:3000/search

# 搜索测试
curl "http://localhost:3000/api/search?q=前端&page=1"

# 建议测试
curl "http://localhost:3000/api/search/suggestions?q=前端"

# 热门搜索测试
curl "http://localhost:3000/api/search/hot"

# 城市列表测试
curl "http://localhost:3000/api/jobs/cities"
```

### 2. 手动测试步骤
1. 打开 `/search` 页面
2. 输入关键词，验证搜索建议是否显示
3. 按 Enter 搜索，验证结果是否正确
4. 检查搜索历史是否保存到 localStorage
5. 刷新页面，验证搜索历史是否保留
6. 点击搜索历史，验证是否能正确搜索
7. 使用筛选条件，验证结果是否过滤
8. 检查匹配关键词是否高亮显示

### 3. 性能测试
- 大数据量搜索响应时间
- 并发搜索请求处理
- 索引是否生效（使用 `EXPLAIN ANALYZE`）

## 后续优化建议

1. **中文分词**: 当前使用 `simple` 配置，可考虑集成 `pg_jieba` 中文分词扩展
2. **搜索权重调优**: 根据业务需求调整字段权重
3. **模糊搜索**: 添加模糊匹配支持（如拼写纠错）
4. **语义搜索**: 集成向量搜索实现语义理解
5. **缓存**: 对热门搜索结果添加 Redis 缓存
6. **搜索分析**: 添加更多搜索分析指标（无结果率、点击率等）

## 迁移说明

运行以下命令应用数据库迁移：

```bash
# 推送 schema 更改
npx prisma db push

# 或运行迁移
npx prisma migrate dev --name add_fulltext_search

# 应用手动 SQL 迁移
psql $DATABASE_URL -f prisma/migrations/20250411_add_fulltext_search/migration.sql
```
