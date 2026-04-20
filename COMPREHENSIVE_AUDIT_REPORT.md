# JobQuip 全面 SEO 审计报告

审计时间: 2026-04-21 02:55
审计范围: 全站 468 个文件，涵盖 SEO、AI索引、功能页面、关键词、博客、BUG

---

## 🔴 严重问题（必须立即修复）

### 1. Google Analytics 未配置
- **文件**: `src/components/google-analytics.tsx`
- **问题**: `NEXT_PUBLIC_GA_ID` 值为 `G-PLACEHOLDER_REPLACE_ME`（环境变量）
- **影响**: 完全没有流量追踪，无法分析用户行为
- **修复**: 替换为真实的 GA4 Measurement ID

### 2. Google 搜索验证文件为占位符
- **文件**: `public/google1234567890abcdef.html`
- **问题**: 文件名和内容都是占位符，不是真实的 Google 验证文件
- **影响**: Google Search Console 无法验证，无法提交 sitemap
- **修复**: 需要从 GSC 获取真实验证文件

### 3. 大量链接缺少 locale 前缀（跨站路由断裂）
影响 30+ 个文件，数百个链接。以下是受影响的页面：

| 文件 | 问题链接 |
|------|---------|
| `blog/[slug]/page.tsx` | `/blog`, `/jobs/${slug}`, `/jobs` |
| `companies/[slug]/page.tsx` | `/`, `/companies` |
| `companies/[slug]/consensus/page.tsx` | `/`, `/companies` |
| `jobs/[slug]/page.tsx` | `/`, `/jobs` (面包屑) |
| `companies/error.tsx` | `/` |
| `blog/error.tsx` | `/` |
| `contact/page.tsx` | `/` |
| `companies/page.tsx` | `/companies` |
| `dashboard/` 多个页面 | `/jobs/${slug}`, `/auth/login` |
| `company/jobs/page.tsx` | `/jobs/${slug}` |
| `admin/` 多个页面 | `/admin/*`, `/` |

**组件级别问题：**
| 组件 | 问题链接 |
|------|---------|
| `contact-unlock-card.tsx` | `/user/recharge`, `/auth/login` |
| `recommendation-section.tsx` | `/auth/login`, `/jobs` |
| `jobs-page-client.tsx` | `/jobs` |
| `apply-modal.tsx` | `/auth/login` |
| `game/level-card.tsx` | `/dashboard/achievements`, `/dashboard/quests` |
| `breadcrumb.tsx` | `/` |
| `related-jobs.tsx` | `/jobs` |

### 4. Canonical URL 缺失/错误
| 文件 | 问题 |
|------|------|
| `salary-insights/page.tsx` | `canonical: "/salary-insights"` 相对URL，缺少locale |
| `salary-insights/layout.tsx` | `canonical: "/salary-insights"` 相对URL，缺少locale |
| `contact/page.tsx` | `canonical: "${SITE_URL}/contact"` 缺少locale |
| `career-trail/page.tsx` | `canonical: "${SITE_URL}/career-trail"` 缺少locale |
| `search/page.tsx` | `canonical: "${SITE_URL}/search..."` 缺少locale |

### 5. sitemap 只包含 `/zh` 路径
- **文件**: `src/app/sitemap.ts`
- **问题**: 动态URL（职位、博客、公司）只有 `/zh/` 路径，缺少 `/en/` 版本
- **影响**: 英文版页面无法被搜索引擎发现

---

## 🟡 中等问题（影响 SEO 效果）

### 6. RSS Feed 仅中文
- **文件**: `src/app/rss.xml/route.ts`
- **问题**: 只输出了中文内容，没有英文版
- **影响**: 英文用户无法通过 RSS 订阅

### 7. 博客详情页 og:type 不一致
- **问题**: `generateJobMetadata` 使用 `type: "article"`，但博客 metadata 使用 `type: "website"`
- **建议**: 博客应使用 `type: "article"`

### 8. `generateStaticParams` 范围过大
- **职位**: `take: 500` → 可能导致构建超时
- **博客**: `take: 500` → 同上
- **公司**: `take: 500` → 同上
- **建议**: 对于大规模站点，考虑使用增量静态生成

### 9. 百度验证代码使用了旧版 push.js
- **文件**: `src/app/[locale]/layout.tsx`
- **问题**: 使用百度旧版自动推送 JS，新版已迁移到资源平台 API
- **建议**: 使用百度 IndexNow 或 API 推送

### 10. 缺少 sitemap index
- **问题**: 当站点 URL 超过 50,000 时，需要 sitemap index 文件
- **当前**: 单个 sitemap 文件
- **建议**: 准备 sitemap index 结构

### 11. 博客文章使用 `pages` 表
- **问题**: 博客存储在 `pages` 表中，字段可能不够丰富（缺少 category、author 等）
- **影响**: 限制了博客 SEO 能力

---

## 🟢 优化建议（非必须但推荐）

### 12. hreflang 标签不完整
- **当前**: 只有 `zh-CN` 和 `en`
- **建议**: 如果有繁体中文用户，可以加 `zh-TW`

### 13. 缺少 `Article` schema 的 `mainEntityOfPage`
- **文件**: `src/lib/schema.ts` 的 `generateArticleSchema`
- **问题**: 缺少 `mainEntityOfPage` 属性
- **影响**: Google Rich Results 可能不完整

### 14. 职位详情 FAQ Schema 动态生成但质量一般
- **文件**: `jobs/[slug]/page.tsx`
- **问题**: 自动生成的 FAQ 内容可能重复或低质量
- **建议**: 使用真实 FAQ 或减少生成范围

### 15. 缺少 `SiteNavigationElement` schema
- **建议**: 为网站导航添加结构化数据

### 16. 图片缺少 alt 标签检查
- **问题**: 部分动态生成的图片可能缺少有意义的 alt 文本
- **建议**: 增加 alt 文本验证

### 17. 缺少 `VideoObject` schema
- **建议**: 如果有视频内容，应添加

### 18. 社交媒体链接不完整
- **文件**: `layout.tsx` Organization Schema
- **问题**: 只有 Twitter 和 LinkedIn 占位符
- **建议**: 添加真实的社交媒体链接

---

## 🐛 代码 BUG

### 19. Blog 详情页 catch 块语法问题
- **文件**: `src/app/[locale]/blog/[slug]/page.tsx`
- **问题**: 函数体末尾有 `} catch { notFound() }` 但不在 try 块内
- **影响**: 可能导致编译错误

### 20. RSS feed 中 `&lt;` 双重转义
- **文件**: `src/app/rss.xml/route.ts`
- **问题**: `content.replace(/&lt;/g, "&lt;")` 是多余的
- **影响**: 可能导致 RSS 解析错误

### 21. `salary-insights/layout.tsx` 的 metadata 覆盖了 locale layout
- **文件**: `src/app/[locale]/salary-insights/layout.tsx`
- **问题**: layout metadata 缺少 `metadataBase`、`robots`、`alternates` 等
- **影响**: 可能覆盖父 layout 的 SEO 配置

### 22. `generateJobMetadata` 中 openGraph `type: "article"` 用于职位
- **文件**: `src/lib/metadata.ts`
- **问题**: 职位应该是 `type: "website"` 或使用 JobPosting schema
- **影响**: 可能导致搜索引擎误分类

### 23. Sitemap 中 `careerStory` 表可能不存在
- **文件**: `src/app/sitemap.ts`
- **问题**: `prisma.careerStory.findMany()` 可能在某些环境失败
- **影响**: sitemap 生成失败

### 24. `next.config.mjs` 中 `eslint-config-next` 版本不匹配
- **问题**: `eslint-config-next: 16.2.3` 但 `next: ^14.2.35`
- **影响**: 可能导致 lint 错误

---

## 📊 SEO 评分总结

| 维度 | 评分 | 说明 |
|------|------|------|
| 技术 SEO | 6/10 | robots/sitemap 基础到位，但 locale 链接断裂严重 |
| 结构化数据 | 7/10 | Schema 覆盖全面，但有细节缺失 |
| 元数据 | 6/10 | 大部分页面有 metadata，但 canonical/hreflang 有问题 |
| 内容 SEO | 7/10 | 关键词覆盖好，博客内容丰富 |
| 性能 | 7/10 | 图片/缓存配置合理，但缺少更多优化 |
| AI 索引 | 8/10 | robots.txt AI 爬虫配置完善 |
| **综合** | **6.8/10** | **基础扎实，细节需大量修复** |

---

## 修复优先级

1. **P0 - 立即修复**: Google Analytics 配置、验证文件、locale 链接断裂
2. **P1 - 本周修复**: Canonical URL、sitemap 英文版、博客 catch bug
3. **P2 - 本月优化**: RSS 英文版、schema 增强、hreflang
4. **P3 - 持续改进**: 内容质量、外链建设、性能优化
