# 招聘平台 - 专业 SEO 优化版

## 技术栈
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js

## 核心功能
- ✅ SSR/SSG 服务端渲染（SEO 友好）
- ✅ JobPosting Schema（Google for Jobs 支持）
- ✅ 动态 Sitemap 生成
- ✅ 图片优化（next/image + Image Sitemap）
- ✅ 多语言支持（中英）
- ✅ 管理后台（职位发布/管理）
- ✅ 广告系统（10个广告位）

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接
```

### 3. 初始化数据库
```bash
npx prisma db push
npm run db:seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

## 部署到 Vercel

### 环境变量设置
在 Vercel 控制台设置以下环境变量：

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SITE_NAME=招聘平台
NEXT_PUBLIC_SITE_DESCRIPTION=专业的求职招聘平台
```

### 构建命令
Vercel 会自动使用：
```bash
npm run build
```

## 管理后台
- 访问: `/admin`
- 默认账号: `admin@example.com`
- 默认密码: `admin123`

## SEO 优化特性

### 1. 结构化数据
- JobPosting Schema（职位详情页）
- Organization Schema（公司页）
- BreadcrumbList Schema（面包屑导航）
- WebSite Schema（首页）

### 2. Meta 标签
- 动态生成 Title/Description
- Open Graph 标签
- Twitter Card
- Canonical URL

### 3. 性能优化
- 图片懒加载 + WebP/AVIF 转换
- 服务端渲染（SSR）
- Edge 缓存
- Core Web Vitals 优化

### 4. 爬虫友好
- 动态 Sitemap
- robots.txt
- 语义化 HTML 结构
- 图片 Alt 属性

## 广告位配置

| 位置 | 名称 | 类型 |
|------|------|------|
| 首页横幅 | HP_BANNER_01 | 图片/轮播 |
| 首页侧边栏 | HP_SIDEBAR_01 | 图片/文字 |
| 职位列表顶部 | JOB_LIST_TOP | 图片 |
| 职位详情推荐 | JOB_DETAIL_REC | 图片 |
| 职位详情内嵌 | JOB_DETAIL_INLINE | 图片 |
| 搜索结果顶部 | SEARCH_TOP | 图片 |
| 公司页横幅 | COMPANY_BANNER | 图片 |
| 页脚横幅 | FOOTER_BANNER | 图片 |

## 目录结构
```
src/
├── app/              # Next.js 页面
│   ├── admin/        # 管理后台
│   ├── api/          # API 路由
│   ├── jobs/         # 职位相关页面
│   └── ...
├── components/       # React 组件
├── lib/              # 工具函数
│   ├── schema.ts     # SEO Schema
│   ├── metadata.ts   # Meta 标签
│   └── prisma.ts     # 数据库客户端
└── ...
```

## 许可证
MIT
