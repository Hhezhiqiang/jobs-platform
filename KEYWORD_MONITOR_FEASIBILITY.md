# 招聘平台关键词监控与自动SEO系统
## 可行性研究报告

**编制时间**: 2026-04-12  
**编制对象**: JobsBro 招聘平台 (`jobs-platform-gold.vercel.app`)  
**报告性质**: 技术可行性 + 执行方案  
**下一步动作**: 待决策确认后进入开发

---

## 一、核心诉求拆解

| 诉求 | 业务目标 | 技术挑战 |
|------|---------|---------|
| **全球热词/新词监控** | 第一时间发现招聘相关搜索热点 | 数据源稳定性、语言过滤、去重 |
| **趋势分析自动判断** | 过滤昙花一现 vs 持续上升的搜索需求 | 时间序列判断、多源交叉验证 |
| **素材抓取归档** | 为AI写博客提供原始素材 | 版权合规、内容清洗、结构化存储 |
| **SEO方案自动生成** | 无需人工即可输出可执行的页面/博客策略 | prompt工程、模板约束、数据闭环 |
| **搜索量/竞争度/意图判断** | 评估值不值得做 | 无 Google Ads API 权限时的替代方案 |
| **招聘词分类（无效/主要/纯流量）** | 避免内容团队做无用功 | 分类模型训练/微调 |
| **自动上站（博客/专题页）** | 从发现热词到页面上线全自动化 | 内容质量控制、人工审核节点 |

**关键认知**: 热词最值钱的是**时间差**。系统目标不是100%无人干预，而是把"从发现到决策"的时间从人工的 2-7 天压缩到 **10 分钟到 2 小时**。

---

## 二、数据源选型与获取方案

### 2.1 全球热词/趋势数据源矩阵

| 数据源 | 覆盖范围 | 更新频率 | API 可用性 | 招聘相关词质量 | 成本 |
|--------|---------|---------|-----------|---------------|------|
| **Google Trends (pytrends)** | 全球/分国家 | 实时-1小时延迟 | 免费（非官方，爬取） | ⭐⭐⭐⭐ | 免费 |
| **Twitter/X API v2** | 全球 | 实时 | 付费/免费 tier | ⭐⭐ | 免费 tier 足够 |
| **Reddit API** | 全球（英文为主） | 实时 | 免费 tier | ⭐⭐⭐ | 免费 |
| **知乎热榜** | 中文 | 小时级 | 爬取/非官方 | ⭐⭐⭐⭐⭐ | 免费 |
| **微博热搜** | 中文 | 分钟级 | 已有 openclaw 插件 | ⭐⭐⭐ | 免费 |
| **百度指数** | 中文 | 日级 | 需 Cookie/代理 | ⭐⭐⭐⭐⭐ | 免费但需维护 |
| **5118 新词监控** | 中文 | 日级 | 付费 API | ⭐⭐⭐⭐⭐ | ￥299-999/月 |
| **Ahrefs/Semrush** | 全球 | 周级 | 高价付费 API | ⭐⭐⭐⭐⭐ | $99-999/月 |
| **SerpAPI (Google Suggest)** | 全球 | 实时 | 付费，按次 | ⭐⭐⭐⭐ | $50-200/月 |
| **Perplexity/S2 API** | 全球 | 实时 | 付费 API | ⭐⭐⭐⭐ | $20-200/月 |

### 2.2 推荐的数据源组合

基于成本控制与效果最大化，推荐**三层监控体系**：

**第一层：免费高频监控（每15分钟跑一轮）**
- Google Trends 实时热搜（按 "jobs", "hiring", "salary", "interview" 等种子词发散）
- 知乎热榜（职场/求职板块）
- 微博热搜（职场/招聘类）
- Reddit r/jobs, r/cscareerquestions, r/productmanagement 热帖

**第二层：日级深度监控（每天跑一次）**
- Google Trends 关键词探索（发现长尾上升词）
- pytrends 的 `related_queries` 和 `rising`
- 5118/站长之家的简单爬虫（可选）

**第三层：付费精准数据（周级月度评估）**
- Semrush / Ahrefs（在有付费预算后接入）
- SerpAPI（用于动态竞争度分析，针对已筛选出的高潜词）

---

## 三、技术架构设计

### 3.1 总体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              数据采集层                                       │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│ Google Trends│   知乎/微博   │    Reddit    │  Twitter/X   │   RSS/News      │
│   (pytrends) │   (爬虫/API)  │   (PRAW)     │   (APIv2)    │   (聚合源)      │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴────────┬────────┘
       │              │              │              │                 │
       └──────────────┴──────────────┴──────────────┴─────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              数据清洗与去重层                                 │
│  - 语言检测 (langdetect / fasttext)                                          │
│  - 招聘领域相关性初筛 (关键词白名单: job, hiring, salary, 面试, 简历...)       │
│  - 去重 (SimHash / MinHash / Jaccard)                                       │
│  - 时间窗口聚合 (最近24h出现频次)                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             AI 分析与分类层                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   趋势分析模型   │  │   意图判断模型   │  │   招聘词分类模型            │  │
│  │  (上升/下降/平稳)│  │ (信息型/导航型/ │  │ (Primary/Traffic/Junk)    │  │
│  │  *多源数据融合*  │  │  交易型)        │  │                            │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
             ┌────────────────────────┼────────────────────────┐
             ▼                        ▼                        ▼
       ┌──────────┐            ┌──────────┐            ┌──────────┐
       │  高潜词库 │            │  待观察  │            │  丢弃词  │
       │  (Action)│            │  (Hold)  │            │  (Junk)  │
       └────┬─────┘            └──────────┘            └──────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              素材收集层                                       │
│  - Perplexity API 自动问答                                                    │
│  - Google SERP 前10结果摘要提取 (SerpAPI / 自建爬虫)                          │
│  - 知乎/Reddit 高赞回答抓取                                                   │
│  - 相关职位数据（从本平台 Prisma DB 提取）                                    │
│  → 统一归档到 Bitable/Notion/本地 DB (一个 `KeywordContentArchive` 表)       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SEO 方案生成层                                     │
│  - LLM Prompt: 基于素材生成 {title, h1, outline, keywords, metaDescription}  │
│  - 页面类型判断：博客文章 vs 专题聚合页 vs FAQ页                              │
│  - 内链策略：推荐关联职位/专题页/城市页                                       │
│  - 输出格式：Markdown + 结构化 JSON                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            人工审核节点（可选但推荐）                          │
│  - 飞书/钉钉/企业微信 推送审批卡片                                             │
│  - 一键通过 / 一键修改 / 一键拒绝                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             自动发布层                                        │
│  - 调用本平台 API 创建博客 (Prisma page.create)                                │
│  - 或创建专题聚合页文件（Next.js 页面）                                       │
│  - 自动更新 Sitemap + 触发 Vercel 重新部署 / ISR revalidate                   │
│  - 搜索引擎主动推送 (Baidu Push / IndexNow API)                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 数据库存储设计建议

在现有 Prisma Schema 中新增以下模型：

```prisma
model KeywordMonitor {
  id            String   @id @default(cuid())
  keyword       String   // 原始关键词
  normalized    String   // 规范化后的关键词（去空格、小写）
  language      String   // zh / en / ja / ...
  source        String   // google_trends / zhihu / reddit / weibo / twitter
  sourceUrl     String?  // 来源链接
  trendScore    Float    // 趋势得分（0-100）
  searchVolume  Int?     // 估算搜索量
  category      String   // PRIMARY / TRAFFIC / JUNK / HOLD
  intent        String   // INFORMATIONAL / NAVIGATIONAL / TRANSACTIONAL
  status        String   @default("PENDING") // PENDING / APPROVED / REJECTED / PUBLISHED
  hotLevel      Int      @default(1) // 1-5 热度分级
  firstSeenAt   DateTime @default(now())
  lastSeenAt    DateTime @updatedAt
  metadata      Json?    // 原始API返回的结构化数据
  
  // 关联
  archives      KeywordArchive[]
  seoPlans      SEOPlan[]
  blogPosts     Page[]   @relation("KeywordBlogPost")
  
  @@index([normalized, source])
  @@index([category, status])
  @@index([trendScore])
  @@index([lastSeenAt])
}

model KeywordArchive {
  id            String   @id @default(cuid())
  monitorId     String
  monitor       KeywordMonitor @relation(fields: [monitorId], references: [id], onDelete: Cascade)
  contentType   String   // SERP_SUMMARY / REDDIT_POST / ZHIHU_ANSWER / PERPLEXITY_QA
  contentUrl    String?  // 原始URL
  contentTitle  String?
  contentBody   String   @db.Text
  fetchedAt     DateTime @default(now())
  relevanceScore Float?  // AI评估的相关性得分
  
  @@index([monitorId, contentType])
}

model SEOPlan {
  id            String   @id @default(cuid())
  monitorId     String
  monitor       KeywordMonitor @relation(fields: [monitorId], references: [id], onDelete: Cascade)
  pageType      String   // BLOG / TOPIC / FAQ / SALARY_REPORT
  title         String
  h1            String
  metaDesc      String
  keywords      String[]
  outline       Json     // 文章大纲/页面结构
  targetUrl     String?  // 预期发布URL
  internalLinks Json?    // 建议内链
  generatedAt   DateTime @default(now())
  generatedBy   String   // 模型版本标识
  approvedAt    DateTime?
  publishedAt   DateTime?
  
  @@index([monitorId, pageType])
}
```

---

## 四、核心难点与技术方案

### 4.1 热词发现：如何让机器"读懂"招聘趋势？

**难点**: Google Trends 等工具返回的是相对值（0-100），没有绝对搜索量。

**方案**: 建立**基准词锚定体系**
- 选定一批已知的高稳定性基准词：
  - 中文：`招聘`（基准值设为 100k 日搜索量）、`简历模板`、`面试技巧`
  - 英文：`jobs near me`、`software engineer resume`、`interview questions`
- 新词的热度 = 与基准词在 Google Trends 中的相对比值 × 基准词预估量
- 这样即使是相对值，也能推算出一个**可比较的绝对热度分**

### 4.2 搜索量与竞争度：没有 Google Keyword Planner 怎么办？

**低成本替代方案矩阵**:

| 指标 | 替代工具/方法 | 精度 | 成本 |
|------|--------------|------|------|
| 搜索量估算 | Google Trends 比值 + 基准词锚定 | 中 | 免费 |
| 搜索量估算 | Keywords Everywhere 插件批量导出 | 中高 | ~$10/月 |
| 竞争度 | Google SERP 前10结果类型分析 | 中 | 免费 |
| 竞争度 | 首页域名权威度（SerpAPI 返回 DA/PA 数据） | 中高 | $50/月 |
| 竞争度 | 搜索结果广告数量 | 中 | SerpAPI 可见 |
| 用户意图 | LLM 分析前10个搜索结果的标题和摘要 | 高 | 按 tokens |

### 4.3 意图分类：招聘词的三种类型

**分类规则（AI Prompt + 规则引擎混合）**

```
Primary Keyword (主要类) — 直接带来转化，值得重点做深度内容
├── 特征：包含岗位名+招聘/求职/工作
├── 示例："Java工程师招聘"、"上海产品经理求职"、"前端远程工作"
└── 策略：创建专题聚合页 + 职位列表 + 城市页

Traffic Keyword (纯流量类) — 搜索量大但转化弱，适合做博客引流
├── 特征：信息型为主，与招聘间接相关
├── 示例："35岁程序员出路"、"大厂年终奖排名"、"字节跳动Leetcode题库"
└── 策略：做博客/资讯内容，在文章内引导到职位页

Junk Keyword (无效类) — 与招聘无关或时效性过强的一次性热词
├── 特征：与平台业务无关联，或明显负面/争议
├── 示例："某大厂裁员名单"、"某CEO丑闻"、"考研国家线"（与招聘无关时）
└── 策略：直接丢弃或归档观望
```

**AI 分类 Prompt 核心片段**:
```
你是一位 SEO 专家，负责为招聘平台判断关键词的商业价值。
请分析以下关键词：{keyword}

请从以下维度输出结构化 JSON：
1. category: "PRIMARY" | "TRAFFIC" | "JUNK"
2. intent: "INFORMATIONAL" | "NAVIGATIONAL" | "TRANSACTIONAL"
3. search_volume_estimate: 低/中/高（基于你的知识判断中文用户搜索行为）
4. competition: 低/中/高（基于首页结果类型判断：知乎/小红书/招聘平台首页占比）
5. content_recommendation: 建议发布的内容类型（博客/专题页/FAQ/不做）
6. reasoning: 50字以内的判断依据
```

### 4.4 素材收集：如何保证内容合规与质量？

**素材获取层级**:
1. **Tier 1（最高权重）**: 本平台数据库中的职位/公司/薪资数据
2. **Tier 2**: Perplexity API 基于实时搜索生成的问答（已做事实核查）
3. **Tier 3**: Google SERP 前10的标题+摘要（不下载全文，用于训练 outline）
4. **Tier 4**: 知乎/Reddit 高赞回答（只提取结构化知识点，不复制大段原文）
5. **Tier 5**: 新闻摘要 / RSS feeds

**版权防火墙**:
- 绝不直接 copy-paste 任何来源的大段文字
- AI 生成内容时，所有 Tier 2-4 的素材仅作为 "outline 和 fact 输入"
- 最终文章由 LLM 重新组织语言输出

### 4.5 自动发布：如何对接现有博客系统？

现有博客系统已经成熟（Prisma `Page` 模型 + ISR + Schema + OG）。自动发布只需调用：**方案A（推荐）: Admin API 自动创建博客**

新建一个受保护的 API：
```ts
POST /api/admin/blog/auto-create
Headers: { Authorization: Bearer ${SYSTEM_TOKEN} }
Body: {
  title, slug, excerpt, content, metaTitle, metaDescription,
  keywords, featuredImage, category, status: "PUBLISHED"
}
```

**发布后的 SEO 增强动作**:
1. 触发 `revalidateTag('blog')` 让 ISR 重新生成
2. 更新 `sitemap.xml`（当前是动态路由，不需要手动改文件）
3. 调用 Baidu Push + Google IndexNow API（新页面主动告知搜索引擎）
4. （可选）生成 OG 图片并上传

---

## 五、成本分析

### 5.1 月度运营成本估算

| 成本项 | MVP方案 | 完整方案 |
|--------|---------|---------|
| **服务器/Vercel** | $0（ Hobby 足够） | $20-50（Pro + 边缘函数） |
| **LLM API** (OpenAI/DeepSeek/Kimi) | ~$10-30/月 | ~$100-300/月 |
| **SerpAPI** | 免费 tier (100次/月) | $50-100/月 |
| **数据监控服务** | 全免费 + 自研爬虫 | ~￥300-1000/月（5118等） |
| **数据库存储** | $0（现有 Neon 足够） | $0-19/月 |
| **图片生成** (OG图) | 无 | $0-20/月 |
| **月度合计** | **$10-40 (~¥70-280)** | **$170-500 (~¥1200-3500)** |

### 5.2 开发人力估算

| 阶段 | 内容 | 工时 | 负责人角色 |
|------|------|------|-----------|
| **MVP** | 热词采集 + AI分类 + 素材归档 + 后台看板 | 3-4 天 | 全栈开发 1 人 |
| **V1.0** | 自动SEO方案生成 + Admin审批 + 自动发布博客 | +2-3 天 | 全栈开发 1 人 |
| **V1.5** | 专题页自动生成 + 搜索引擎主动推送 | +2 天 | 全栈开发 1 人 |
| **总计** | 完整闭环 | **7-9 天** | 全栈开发 1 人 |

---

## 六、推荐的最小可行产品（MVP）

### MVP 目标
**在 3-4 天内跑通"发现热词 → AI分类 → 素材归档 → 人工确认 → 手动发布"的半自动链路。**

### MVP 功能边界

**要有（Must Have）**:
1. ✅ 每 15 分钟抓取一次 Google Trends + 知乎热榜
2. ✅ 与招聘相关的词进入候选池
3. ✅ AI 自动分类为 PRIMARY / TRAFFIC / JUNK
4. ✅ 为 PRIMARY 和高质量 TRAFFIC 词自动收集素材（Perplexity + SERP）
5. ✅ Admin 后台新增"关键词监控"页面，展示候选词列表
6. ✅ 一键生成 SEO 方案（Markdown大纲）
7. ✅ 一键复制到现有博客编辑器，手动微调后发布

**不要有（Won't Have in MVP）**:
1. ❌ 全自动发布（无人工审核）
2. ❌ 自动创建 Next.js 页面文件
3. ❌ 多语言小语种热词监控
4. ❌ 视频/图片素材采集
5. ❌ 竞品关键词对比矩阵

### MVP 产出价值
- **监控范围**: 覆盖中文+英文核心招聘趋势
- **决策速度**: 从"发现热词"到"生成内容大纲"压缩到 **10 分钟**
- **内容产出**: 预计第一周可辅助产出 **5-8 篇精准博客/专题页**

---

## 七、关键技术决策清单

| 决策项 | 推荐方案 | 理由 |
|--------|---------|------|
| 调度器 | Vercel Cron Jobs | 与现有部署平台一致，免费 tier 足够 |
| LLM 选型 | DeepSeek-V3 / Kimi K2 / GPT-4o | 中文生成效果好，成本低 |
| 数据存储 | 现有 Neon + Prisma | 无需新基础设施 |
| 后台看板 | 复用现有 `/admin` 管理后台 | 统一体验，开发快 |
| 趋势爬取 | `pytrends` + `axios` 爬虫 | 成熟稳定，无需额外付费 |
| 内容生成 | LLM + Markdown模板约束 | 与现有博客系统（ReactMarkdown）兼容 |
| 图片生成 | 暂不接入（MVP） | 可用通用 OG 图替代 |

---

## 八、风险分析

| 风险 | 可能性 | 影响 | 应对策略 |
|------|--------|------|----------|
| Google Trends 封IP | 中 | 监控断线 | 增加代理池 + 多源冗余 |
| AI 生成内容质量不达预期 | 中 | 内容低质影响SEO | 必须加入人工审核节点 |
| 热词时效性过强，内容上线时已降温 | 高 | 投入产出比低 | AI 增加" trend_duration "判断，只追持续 3 天以上上升的词 |
| 爬虫/RSS数据源失效 | 中 | 监控覆盖减少 | 监控脚本自身要有健康检查 |
| 内容版权争议 | 低 | 法律风险 | 严格的版权防火墙（不复制全文） |
| Vercel Cron 免费额度不足 | 低 | 调度失败 | Hobby 足够跑 15min 级 cron |

---

## 九、执行建议与下一步动作

### 如果确认 MVP 方案

**Week 1 执行计划**:

| 天数 | 任务 |
|------|------|
| Day 1 | Schema 设计（KeywordMonitor + KeywordArchive + SEOPlan）+ Prisma migrate |
| Day 2 | 数据采集引擎（Google Trends + 知乎 + Reddit + 微博）+ 去重清洗 |
| Day 3 | AI 分类模块 + 素材归档引擎 + Admin 后台列表页 |
| Day 4 | SEO 方案生成 Prompt + 一键生成 Markdown / 对接现有博客 API / 测试闭环 |

### 你现在的选择

**A. 确认 MVP，直接进入开发**
→ 我立即开始 Day 1 工作（Schema + migrate + 第一个爬虫）

**B. 想要完整方案，不只是 MVP**
→ 增加 3-5 天工期，直接做全自动发布 + 专题页自动生成 + 搜索引擎主动推送

**C. 先调整方案**
→ 告诉我你的修改意见（比如先只做中文市场、或者先不接 Reddit、或者预算限制等）

**D. 先静态看看效果**
→ 我可以先帮你写一个"今日热词监控报告"的 Demo，展示系统能发现什么词、如何分类，让你看到实际价值再决定

---

**报告已保存至**: `/root/.openclaw/workspace/jobs-platform/KEYWORD_MONITOR_FEASIBILITY.md`

等你确认方向。
