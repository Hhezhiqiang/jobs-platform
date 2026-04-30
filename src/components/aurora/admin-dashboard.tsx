"use client";

import Link from "next/link";
import {
  Briefcase, Building2, FileText, Users, Eye,
  TrendingUp, ChevronRight, Wallet, BarChart3,
  Sparkles, Globe, FileSpreadsheet, KeyRound, Megaphone,
} from "lucide-react";

interface AdminDashboardProps {
  userCount: number;
  jobCount: number;
  activeJobs: number;
  companyCount: number;
  blogCount: number;
  totalViews: number;
  recentJobs: any[];
  recentBlogs: any[];
}

export function AuroraAdminDashboard({ userCount, jobCount, activeJobs, companyCount, blogCount, totalViews, recentJobs, recentBlogs }: AdminDashboardProps) {
  const stats = [
    { title: "总用户数", value: userCount.toLocaleString(), icon: Users, color: "from-purple-500 to-purple-600", bgColor: "bg-purple-50" },
    { title: "总职位数", value: jobCount.toLocaleString(), icon: Briefcase, color: "from-[#6366f1] to-[#8b5cf6]", bgColor: "bg-[#eef2ff]" },
    { title: "在招职位", value: activeJobs.toLocaleString(), icon: TrendingUp, color: "from-emerald-500 to-emerald-600", bgColor: "bg-emerald-50" },
    { title: "公司数", value: companyCount.toLocaleString(), icon: Building2, color: "from-amber-500 to-amber-600", bgColor: "bg-amber-50" },
    { title: "博客文章", value: blogCount.toLocaleString(), icon: FileText, color: "from-pink-500 to-pink-600", bgColor: "bg-pink-50" },
    { title: "总浏览量", value: totalViews.toLocaleString(), icon: Eye, color: "from-cyan-500 to-cyan-600", bgColor: "bg-cyan-50" },
  ];

  const navItems = [
    { icon: Briefcase, label: "职位管理", href: "/admin/jobs", count: jobCount },
    { icon: Building2, label: "公司管理", href: "/admin/companies", count: companyCount },
    { icon: FileText, label: "博客管理", href: "/admin/blog", count: blogCount },
    { icon: Megaphone, label: "广告管理", href: "/admin/ads" },
    { icon: Users, label: "用户管理", href: "/admin/users", count: userCount },
    { icon: TrendingUp, label: "推广者管理", href: "/admin/promoters" },
    { icon: Wallet, label: "提现审核", href: "/admin/withdrawals" },
    { icon: KeyRound, label: "关键词监控", href: "/admin/keywords" },
    { icon: BarChart3, label: "数据分析", href: "/admin/analytics" },
    { icon: Globe, label: "地理位置", href: "/admin/analytics/geo" },
    { icon: FileSpreadsheet, label: "CPS 报表", href: "/admin/reports/cps" },
  ];

  const quickActions = [
    { label: "发布新职位", href: "/admin/jobs/new", icon: Briefcase, color: "from-[#6366f1] to-[#8b5cf6]" },
    { label: "发布博客", href: "/admin/blog/new", icon: FileText, color: "from-emerald-500 to-emerald-600" },
    { label: "用户管理", href: "/admin/users", icon: Users, color: "from-purple-500 to-purple-600" },
    { label: "推广者管理", href: "/admin/promoters", icon: TrendingUp, color: "from-teal-500 to-teal-600" },
    { label: "提现审核", href: "/admin/withdrawals", icon: Wallet, color: "from-amber-500 to-amber-600" },
    { label: "关键词监控", href: "/admin/keywords", icon: KeyRound, color: "from-pink-500 to-pink-600" },
    { label: "数据分析", href: "/admin/analytics", icon: BarChart3, color: "from-cyan-500 to-cyan-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366f1]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-[#8b5cf6]/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#a5b4fc]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">欢迎回来，管理员</h1>
              <p className="text-white/60">今天是全新的一天，继续优化平台吧！</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.title} className="aurora-card rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Grid */}
      <div className="aurora-card rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">快速导航</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#6366f1]/30 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all"
            >
              <div className="w-10 h-10 bg-[#eef2ff] rounded-lg flex items-center justify-center group-hover:bg-[#6366f1] transition-colors">
                <item.icon className="w-5 h-5 text-[#6366f1] group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{item.label}</p>
                {item.count !== undefined && (
                  <p className="text-xs text-gray-500">{item.count.toLocaleString()}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#6366f1] transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="aurora-card rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${action.color} text-white font-medium rounded-xl hover:shadow-lg transition-all`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Jobs & Blogs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="aurora-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">最近发布的职位</h2>
            <Link href="/admin/jobs" className="text-[#6366f1] hover:text-[#4f46e5] text-sm font-medium flex items-center gap-1">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentJobs.map((job: any) => (
              <div key={job.id} className="p-4 hover:bg-[#eef2ff]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-500">{job.companies?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                    {job.status === "ACTIVE" ? "招聘中" : "已关闭"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Blogs */}
        <div className="aurora-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">最近发布的博客</h2>
            <Link href="/admin/blog" className="text-[#6366f1] hover:text-[#4f46e5] text-sm font-medium flex items-center gap-1">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentBlogs.map((blog: any) => (
              <div key={blog.id} className="p-4 hover:bg-[#eef2ff]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{blog.title}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span>{blog.users?.name}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {blog.viewCount || 0}
                      </span>
                    </div>
                  </div>
                  <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${blog.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : blog.status === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                    {blog.status === "PUBLISHED" ? "已发布" : blog.status === "DRAFT" ? "草稿" : "已归档"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
