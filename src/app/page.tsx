import Link from "next/link";
import { getHomePageData } from "@/lib/optimized-queries";
import { generateHomeMetadata } from "@/lib/metadata";
import { JobCard } from "@/components/job-card";
import { AdBanner } from "@/components/ad-banner";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = generateHomeMetadata();

export default async function HomePage() {
  // 使用优化的批量查询（带缓存）
  const { featuredJobs, latestJobs, hotCompanies, stats } = await getHomePageData();

  const { jobCount, companyCount, blogCount } = stats;

  // 热门搜索词
  const hotSearches = ["前端工程师", "产品经理", "Java开发", "数据分析师", "UI设计师", "运营"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              招聘平台
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/jobs" className="text-gray-600 hover:text-blue-600">
                职位
              </Link>
              <Link href="/companies" className="text-gray-600 hover:text-blue-600">
                公司
              </Link>
              <Link href="/blog" className="text-gray-600 hover:text-blue-600">
                博客
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-blue-600">
                关于
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-blue-600"
              >
                登录
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                注册
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - SEO Optimized */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            发现理想工作，开启职业新篇章
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-3xl mx-auto">
            连接优秀人才与顶尖企业，{jobCount}+ 热招职位等你申请
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-8">
            <form action="/jobs" className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="search"
                  name="q"
                  placeholder="搜索职位、公司或关键词..."
                  className="w-full px-6 py-4 rounded-lg text-gray-800 text-lg focus:outline-none focus:ring-4 focus:ring-blue-400"
                  aria-label="搜索职位"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 px-8 py-4 rounded-lg font-semibold text-lg transition"
              >
                搜索
              </button>
            </form>
          </div>

          {/* Hot Searches */}
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="text-blue-200">热门搜索：</span>
            {hotSearches.map((tag) => (
              <Link
                key={tag}
                href={`/jobs?q=${encodeURIComponent(tag)}`}
                className="text-blue-200 hover:text-white underline"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Social Proof */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="stat-item">
              <div className="text-4xl font-bold text-blue-600 mb-2">{jobCount.toLocaleString()}+</div>
              <div className="text-gray-600">在招职位</div>
            </div>
            <div className="stat-item">
              <div className="text-4xl font-bold text-blue-600 mb-2">{companyCount.toLocaleString()}+</div>
              <div className="text-gray-600">合作企业</div>
            </div>
            <div className="stat-item">
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">简历通过率</div>
            </div>
            <div className="stat-item">
              <div className="text-4xl font-bold text-blue-600 mb-2">4.9</div>
              <div className="text-gray-600">用户评分</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <AdBanner position="HP_BANNER_01" className="w-full" />
      </section>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🔥 热招职位</h2>
            <Link href="/jobs" className="text-blue-600 hover:text-blue-800">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Hot Companies */}
      <section className="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🏢 热门企业</h2>
          <Link href="/companies" className="text-blue-600 hover:text-blue-800">
            查看全部 →
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          {hotCompanies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="bg-white px-6 py-4 rounded-lg shadow hover:shadow-md transition flex items-center gap-3"
            >
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-10 h-10 rounded object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold">
                  {company.name.charAt(0)}
                </div>
              )}
              <span className="font-medium">{company.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🆕 最新职位</h2>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-800">
            查看全部 →
          </Link>
        </div>
        <div className="space-y-4">
          {latestJobs.map((job) => (
            <JobCard key={job.id} job={job} compact />
          ))}
        </div>
      </section>

      {/* Blog Section */}
      {blogCount > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 bg-blue-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">📝 职场干货</h2>
            <Link href="/blog" className="text-blue-600 hover:text-blue-800">
              更多文章 →
            </Link>
          </div>
          <p className="text-gray-600 mb-6">{blogCount}+ 篇专业文章，助你职场进阶</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/blog" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="font-bold mb-2">求职技巧</h3>
              <p className="text-gray-600 text-sm">简历优化、面试攻略、谈薪技巧</p>
            </Link>
            <Link href="/blog" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-3xl mb-4">💼</div>
              <h3 className="font-bold mb-2">职业发展</h3>
              <p className="text-gray-600 text-sm">行业洞察、技能提升、转型指南</p>
            </Link>
            <Link href="/blog" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-bold mb-2">薪资报告</h3>
              <p className="text-gray-600 text-sm">各岗位薪资水平、行业趋势分析</p>
            </Link>
          </div>
        </section>
      )}

      {/* Footer - SEO Optimized */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">招聘平台</h3>
              <p className="text-gray-400 text-sm">专业的求职招聘平台，连接优秀人才与顶尖企业</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">快速链接</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/jobs" className="hover:text-white">职位列表</Link></li>
                <li><Link href="/companies" className="hover:text-white">公司列表</Link></li>
                <li><Link href="/blog" className="hover:text-white">职场博客</Link></li>
                <li><Link href="/admin" className="hover:text-white">管理后台</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">法律信息</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/terms" className="hover:text-white">用户协议</Link></li>
                <li><Link href="/privacy" className="hover:text-white">隐私政策</Link></li>
                <li><Link href="/about" className="hover:text-white">关于我们</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">联系我们</h3>
              <p className="text-gray-400 text-sm">邮箱：support@jobs-platform.com</p>
              <p className="text-gray-400 text-sm mt-2">工作时间：周一至周五 9:00-18:00</p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2026 招聘平台. All rights reserved. | 
              <Link href="/sitemap.xml" className="hover:text-gray-300">Sitemap</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
