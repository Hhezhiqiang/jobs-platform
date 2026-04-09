import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { JobCard } from "@/components/job-card";
import { AdBanner } from "@/components/ad-banner";

async function getFeaturedJobs() {
  return await prisma.job.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    include: { company: true },
    orderBy: { datePosted: "desc" },
    take: 6,
  });
}

async function getLatestJobs() {
  return await prisma.job.findMany({
    where: { status: "ACTIVE" },
    include: { company: true },
    orderBy: { datePosted: "desc" },
    take: 10,
  });
}

async function getStats() {
  const [jobCount, companyCount] = await Promise.all([
    prisma.job.count({ where: { status: "ACTIVE" } }),
    prisma.company.count(),
  ]);
  return { jobCount, companyCount };
}

export default async function HomePage() {
  const [featuredJobs, latestJobs, stats] = await Promise.all([
    getFeaturedJobs(),
    getLatestJobs(),
    getStats(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              招聘平台
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/jobs" className="text-gray-700 hover:text-blue-600">
                职位
              </Link>
              <Link href="/companies" className="text-gray-700 hover:text-blue-600">
                公司
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600">
                关于我们
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                发布职位
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              找到理想的工作
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              连接优秀人才与优质企业，让求职更简单
            </p>
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.jobCount}+</div>
                <div className="text-blue-200">活跃职位</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.companyCount}+</div>
                <div className="text-blue-200">入驻企业</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Banner Ad */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdBanner position="HP_BANNER_01" />
      </section>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-6">精选职位</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">最新职位</h2>
          <Link
            href="/jobs"
            className="text-blue-600 hover:text-blue-800"
          >
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
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">招聘平台</h3>
              <p className="text-gray-400">
                专业的求职招聘平台，连接优秀人才与优质企业。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">快速链接</h3>
              <ul className="space-y-2">
                <li><Link href="/jobs" className="text-gray-400 hover:text-white">职位搜索</Link></li>
                <li><Link href="/companies" className="text-gray-400 hover:text-white">公司列表</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">关于我们</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            © 2024 招聘平台. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
