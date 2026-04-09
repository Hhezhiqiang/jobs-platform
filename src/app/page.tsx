import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateHomeMetadata } from "@/lib/metadata";
import { JobCard } from "@/components/job-card";
import { AdBanner } from "@/components/ad-banner";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = generateHomeMetadata();

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
    take: 10,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              招聘平台
            </Link>
            <nav className="flex gap-6">
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
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">发现理想工作</h1>
          <p className="text-xl mb-8">连接优秀人才与顶尖企业</p>
          <Link
            href="/jobs"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            浏览职位
          </Link>
        </div>
      </section>

      {/* Ad Banner */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <AdBanner position="HP_BANNER_01" className="w-full" />
      </section>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">精选职位</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Jobs */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">最新职位</h2>
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

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">招聘平台</h3>
              <p className="text-gray-400">专业的求职招聘平台</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">快速链接</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/jobs">职位列表</Link></li>
                <li><Link href="/companies">公司列表</Link></li>
                <li><Link href="/admin">管理后台</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">联系我们</h3>
              <p className="text-gray-400">contact@example.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 招聘平台. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
