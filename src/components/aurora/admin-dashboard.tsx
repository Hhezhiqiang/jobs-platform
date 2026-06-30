"use client";

import Link from "next/link";
import {
  Briefcase,
  Building2,
  FileSpreadsheet,
  FileText,
  Globe,
  KeyRound,
  Megaphone,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Eye,
  BarChart3,
  ChevronRight,
} from "lucide-react";

type RecentJob = {
  id: string;
  title: string;
  status: string;
  companies?: { name: string | null } | null;
};

type RecentBlog = {
  id: string;
  title: string;
  status: string;
  viewCount?: number | null;
  users?: { name: string | null } | null;
};

interface AdminDashboardProps {
  userCount: number;
  jobCount: number;
  activeJobs: number;
  companyCount: number;
  blogCount: number;
  totalViews: number;
  recentJobs: RecentJob[];
  recentBlogs: RecentBlog[];
}

export function AuroraAdminDashboard({
  userCount,
  jobCount,
  activeJobs,
  companyCount,
  blogCount,
  totalViews,
  recentJobs,
  recentBlogs,
}: AdminDashboardProps) {
  const stats = [
    { title: "总用户数", value: userCount.toLocaleString(), icon: Users, bgColor: "bg-purple-50" },
    { title: "总职位数", value: jobCount.toLocaleString(), icon: Briefcase, bgColor: "bg-indigo-50" },
    { title: "在招职位", value: activeJobs.toLocaleString(), icon: TrendingUp, bgColor: "bg-emerald-50" },
    { title: "公司数", value: companyCount.toLocaleString(), icon: Building2, bgColor: "bg-amber-50" },
    { title: "博客文章", value: blogCount.toLocaleString(), icon: FileText, bgColor: "bg-pink-50" },
    { title: "总浏览量", value: totalViews.toLocaleString(), icon: Eye, bgColor: "bg-cyan-50" },
  ];

  const navItems = [
    { icon: Briefcase, label: "职位管理", href: "/admin/jobs", count: jobCount },
    { icon: Building2, label: "公司管理", href: "/admin/companies", count: companyCount },
    { icon: FileText, label: "博客管理", href: "/admin/blog", count: blogCount },
    { icon: Megaphone, label: "广告管理", href: "/admin/ads" },
    { icon: Users, label: "用户管理", href: "/admin/users", count: userCount },
    { icon: TrendingUp, label: "推广者", href: "/admin/promoters" },
    { icon: Wallet, label: "提现审核", href: "/admin/withdrawals" },
    { icon: KeyRound, label: "关键词监控", href: "/admin/keywords" },
    { icon: BarChart3, label: "数据分析", href: "/admin/analytics" },
    { icon: Globe, label: "地理分析", href: "/admin/analytics/geo" },
    { icon: FileSpreadsheet, label: "CPS 报表", href: "/admin/reports/cps" },
  ];

  const quickActions = [
    { label: "发布职位", href: "/admin/jobs/new", icon: Briefcase, color: "from-indigo-500 to-violet-600" },
    { label: "发布博客", href: "/admin/blog/new", icon: FileText, color: "from-emerald-500 to-teal-600" },
    { label: "用户管理", href: "/admin/users", icon: Users, color: "from-purple-500 to-pink-600" },
    { label: "推广者", href: "/admin/promoters", icon: TrendingUp, color: "from-sky-500 to-cyan-600" },
    { label: "提现审核", href: "/admin/withdrawals", icon: Wallet, color: "from-amber-500 to-orange-600" },
    { label: "关键词", href: "/admin/keywords", icon: KeyRound, color: "from-fuchsia-500 to-rose-600" },
    { label: "数据分析", href: "/admin/analytics", icon: BarChart3, color: "from-cyan-500 to-blue-600" },
  ];

  const getJobStatusLabel = (status: string) => {
    if (status === "ACTIVE") return "招聘中";
    if (status === "INACTIVE") return "已关闭";
    if (status === "DRAFT") return "草稿";
    return status;
  };

  const getBlogStatusLabel = (status: string) => {
    if (status === "PUBLISHED") return "已发布";
    if (status === "DRAFT") return "草稿";
    if (status === "ARCHIVED") return "已归档";
    return status;
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 p-8 text-white">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
            <Sparkles className="h-6 w-6 text-indigo-200" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">欢迎回来，管理员</h1>
            <p className="text-white/70">今天适合继续把平台打磨得更稳一点。</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.title} className="aurora-card rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-500">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                <stat.icon className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="aurora-card rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900">快速导航</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl border border-gray-100 p-4 transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 transition-colors group-hover:bg-indigo-600">
                <item.icon className="h-5 w-5 text-indigo-600 transition-colors group-hover:text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{item.label}</p>
                {item.count !== undefined && <p className="text-xs text-gray-500">{item.count.toLocaleString()}</p>}
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-indigo-600" />
            </Link>
          ))}
        </div>
      </div>

      <div className="aurora-card rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 rounded-xl bg-gradient-to-r px-5 py-2.5 font-medium text-white transition-all hover:shadow-lg ${action.color}`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="aurora-card overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">最近发布的职位</h2>
            <Link href="/admin/jobs" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <div key={job.id} className="p-4 transition-colors hover:bg-indigo-50/50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.companies?.name || "未知公司"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${job.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                      {getJobStatusLabel(job.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">暂无职位</div>
            )}
          </div>
        </div>

        <div className="aurora-card overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">最近发布的博客</h2>
            <Link href="/admin/blog" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentBlogs.length > 0 ? (
              recentBlogs.map((blog) => (
                <div key={blog.id} className="p-4 transition-colors hover:bg-indigo-50/50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{blog.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                        <span>{blog.users?.name || "匿名作者"}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {blog.viewCount || 0}
                        </span>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${blog.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : blog.status === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                      {getBlogStatusLabel(blog.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">暂无博客</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
