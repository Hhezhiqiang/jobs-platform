import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Briefcase, Building2, FileText, Users, Eye,
  Plus, TrendingUp, ChevronRight, Wallet,
} from "lucide-react";
import { AdzunaSyncButtons } from "@/components/adzuna-sync-buttons";
import { StatCard } from "@/components/admin";

export const metadata: Metadata = {
  title: "管理员控制台 | 求职平台",
  description: "管理平台职位、公司、用户和数据分析",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [jobCount, companyCount, blogCount, totalViews, userCount] = await Promise.all([
    prisma.jobs.count(),
    prisma.companies.count(),
    prisma.pages.count({ where: { type: "BLOG" } }),
    prisma.pages.aggregate({
      where: { type: "BLOG" },
      _sum: { viewCount: true },
    }),
    prisma.users.count(),
  ]);

  const [recentJobs, recentBlogs, activeJobs] = await Promise.all([
    prisma.jobs.findMany({
      include: { companies: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.pages.findMany({
      where: { type: "BLOG" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { users: true },
    }),
    prisma.jobs.count({ where: { status: "ACTIVE" } }),
  ]);

  const quickActions = [
    { label: "发布新职位", href: "/admin/jobs/new", color: "bg-blue-600 hover:bg-blue-700" },
    { label: "发布博客", href: "/admin/blog/new", color: "bg-green-600 hover:bg-green-700" },
    { label: "用户管理", href: "/admin/users", color: "bg-purple-600 hover:bg-purple-700" },
    { label: "推广者管理", href: "/admin/promoters", color: "bg-teal-600 hover:bg-teal-700" },
    { label: "提现审核", href: "/admin/withdrawals", color: "bg-orange-600 hover:bg-orange-700" },
    { label: "关键词监控", href: "/admin/keywords", color: "bg-pink-600 hover:bg-pink-700" },
    { label: "数据分析", href: "/admin/analytics", color: "bg-cyan-600 hover:bg-cyan-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="总用户数"
          value={userCount.toLocaleString()}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="总职位数"
          value={jobCount.toLocaleString()}
          icon={Briefcase}
          color="blue"
        />
        <StatCard
          title="在招职位"
          value={activeJobs.toLocaleString()}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="公司数"
          value={companyCount.toLocaleString()}
          icon={Building2}
          color="orange"
        />
        <StatCard
          title="博客文章"
          value={blogCount.toLocaleString()}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="总浏览量"
          value={(totalViews._sum.viewCount || 0).toLocaleString()}
          icon={Eye}
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium text-white transition-all ${action.color}`}
            >
              <Plus className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Jobs & Blogs */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recent Jobs */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">最近发布的职位</h2>
            <Link
              href="/admin/jobs"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              查看全部 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentJobs.map((job) => (
              <div key={job.id} className="p-4 transition-colors hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-500">{job.companies.name}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      job.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {job.status === "ACTIVE" ? "招聘中" : "已关闭"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Blogs */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">最近发布的博客</h2>
            <Link
              href="/admin/blog"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              查看全部 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentBlogs.map((blog) => (
              <div key={blog.id} className="p-4 transition-colors hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{blog.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span>{blog.users.name}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {blog.viewCount}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`ml-4 rounded-full px-3 py-1 text-xs font-medium ${
                      blog.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : blog.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {blog.status === "PUBLISHED"
                      ? "已发布"
                      : blog.status === "DRAFT"
                        ? "草稿"
                        : "已归档"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adzuna Sync */}
      <AdzunaSyncButtons />
    </div>
  );
}
