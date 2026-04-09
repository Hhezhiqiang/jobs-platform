import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { generateHomeMetadata } from "@/lib/metadata";
import { JobCard } from "@/components/job-card";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = generateHomeMetadata();

// 热门搜索关键词（SEO 优化）
const HOT_SEARCHES = [
  "前端工程师", "Java开发", "产品经理", "UI设计师", 
  "数据分析师", "算法工程师", "运营", "测试工程师"
];

// 首页统计展示
const STATS = [
  { icon: "💼", value: "10,000+", label: "在招职位" },
  { icon: "🏢", value: "500+", label: "合作企业" },
  { icon: "📈", value: "98%", label: "简历通过率" },
  { icon: "⭐", value: "4.9", label: "用户评分" },
];

// 热门企业 Logo（模拟数据）
const TOP_COMPANIES = [
  "字节跳动", "阿里巴巴", "腾讯", "美团", "京东", "百度", "滴滴", "快手"
];

export default async function HomePage() {
  // 获取精选职位
  const featuredJobs = await prisma.job.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    include: { company: true },
    orderBy: { datePosted: "desc" },
    take: 6,
  });

  // 获取最新职位
  const latestJobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    include: { company: true },
    orderBy: { datePosted: "desc" },
    take: 5,
  });

  // 获取最新博客
  const latestBlogs = await prisma.page.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { author: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50" role="navigation" aria-label="主导航">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600" aria-label="招聘平台首页">
              招聘平台
            </Link>
            <div className="hidden md:flex gap-8">
              <Link href="/jobs" className="text-gray-600 hover:text-blue-600 transition-colors">
                职位
              </Link>
              <Link href="/companies" className="text-gray-600 hover:text-blue-600 transition-colors">
                公司
              </Link>
              <Link href="/blog" className="text-gray-600 hover:text-blue-600 transition-colors">
                职场干货
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                关于我们
              </Link>
            </div>
            <div className="flex gap-4">
              <Link 
                href="/admin/jobs/new" 
                className="hidden sm:block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                发布职位
              </Link>
              <Link 
                href="/auth/login" 
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                登录
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - SEO 优化 */}
      <header className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            发现理想工作，开启职业新篇章
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-blue-100">
            连接优秀人才与顶尖企业，让每一次求职都有价值
          </p>

          {/* 搜索框 */}
          <div className="max-w-2xl mx-auto mb-8">
            <form action="/jobs" method="GET" className="relative">
              <input
                type="search"
                name="q"
                placeholder="搜索职位、公司或关键词..."
                className="w-full px-6 py-4 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="搜索职位"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                搜索
              </button>
            </form>
          </div>

          {/* 热门搜索 */}
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="text-blue-200">热门搜索：</span>
            {HOT_SEARCHES.map((tag) => (
              <Link
                key={tag}
                href={`/jobs?q=${encodeURIComponent(tag)}`}
                className="text-white hover:text-blue-200 underline underline-offset-4 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Stats Section - 信任背书 */}
      <section className="py-12 bg-white" aria-label="平台数据">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4" aria-labelledby="featured-jobs-title">
          <div className="flex items-center justify-between mb-8">
            <h2 id="featured-jobs-title" className="text-2xl md:text-3xl font-bold">
              🔥 热招职位
            </h2>
            <Link 
              href="/jobs" 
              className="text-blue-600 hover:text-blue-800 font-medium"
              aria-label="查看全部职位"
            >
              查看全部 →
            </Link>
          </div>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            itemScope 
            itemType="https://schema.org/ItemList"
          >
            {featuredJobs.map((job, index) => (
              <div key={job.id} itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <meta itemProp="position" content={String(index + 1)} />
                <JobCard job={job} featured />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest Jobs */}
      {latestJobs.length > 0 && (
        <section className="py-16 bg-white" aria-labelledby="latest-jobs-title">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 id="latest-jobs-title" className="text-2xl md:text-3xl font-bold">
                🆕 最新职位
              </h2>
              <Link 
                href="/jobs" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                查看全部 →
              </Link>
            </div>
            
            <div className="space-y-4">
              {latestJobs.map((job) => (
                <JobCard key={job.id} job={job} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Companies */}
      <section className="py-16 max-w-7xl mx-auto px-4" aria-labelledby="companies-title">
        <h2 id="companies-title" className="text-2xl md:text-3xl font-bold text-center mb-12">
          🏢 热门企业
        </h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
          {TOP_COMPANIES.map((company) => (
            <Link
              key={company}
              href={`/jobs?q=${encodeURIComponent(company)}`}
              className="flex items-center justify-center h-16 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              title={`${company}招聘信息`}
            >
              <span className="text-sm font-medium text-gray-700">{company}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Blog Section */}
      {latestBlogs.length > 0 && (
        <section className="py-16 bg-gray-100" aria-labelledby="blog-title">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 id="blog-title" className="text-2xl md:text-3xl font-bold">
                📝 职场干货
              </h2>
              <Link 
                href="/blog" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                更多文章 →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestBlogs.map((blog) => (
                <article 
                  key={blog.id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  itemScope 
                  itemType="https://schema.org/BlogPosting"
                >
                  {blog.featuredImage && (
                    <div className="h-40 bg-gray-200 relative">
                      <Image
                        src={blog.featuredImage}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2" itemProp="headline">
                      <Link href={`/blog/${blog.slug}`} className="hover:text-blue-600">
                        {blog.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2" itemProp="description">
                      {blog.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{blog.author.name}</span>
                      <span>{blog.viewCount} 阅读</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white" aria-label="行动号召">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好开始你的职业新篇章了吗？</h2>
          <p className="text-xl mb-8 text-blue-100">
            立即注册，发现更多优质职位
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              免费注册
            </Link>
            <Link
              href="/jobs"
              className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors border-2 border-white"
            >
              浏览职位
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">招聘平台</h3>
              <p className="text-gray-400 text-sm">
                专业的求职招聘平台，连接优秀人才与顶尖企业，让每一次求职都有价值。
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">求职者</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/jobs" className="hover:text-white">搜索职位</Link></li>
                <li><Link href="/companies" className="hover:text-white">浏览公司</Link></li>
                <li><Link href="/blog" className="hover:text-white">职场干货</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">企业</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/admin/jobs/new" className="hover:text-white">发布职位</Link></li>
                <li><Link href="/admin/companies/new" className="hover:text-white">企业入驻</Link></li>
                <li><Link href="/about" className="hover:text-white">关于我们</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">法律条款</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/terms" className="hover:text-white">用户协议</Link></li>
                <li><Link href="/privacy" className="hover:text-white">隐私政策</Link></li>
                <li><Link href="/contact" className="hover:text-white">联系我们</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} 招聘平台. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
