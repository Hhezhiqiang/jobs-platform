import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  LayoutDashboard, 
  Briefcase, 
  Building2, 
  FileText, 
  Users, 
  Eye,
  Plus,
  TrendingUp,
  ChevronRight,
  BarChart3,
  Sparkles,
  Wallet,
  PieChart,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "管理员控制台 | 求职平台",
  description: "管理平台职位、公司、用户和数据分析",
};

export const dynamic = "force-dynamic";
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/auth/login/admin`);
  }

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

  const navItems = [
    { icon: LayoutDashboard, label: "概览", href: "/admin", active: true },
    { icon: Briefcase, label: "职位管理", href: "/admin/jobs" },
    { icon: Building2, label: "公司管理", href: "/admin/companies" },
    { icon: FileText, label: "博客管理", href: "/admin/blog" },
    { icon: Sparkles, label: "关键词监控", href: "/admin/keywords" },
    { icon: Users, label: "用户管理", href: "/admin/users" },
    { icon: BarChart3, label: "数据分析", href: "/admin/analytics" },
    { icon: TrendingUp, label: "推广者管理", href: "/admin/promoters" },
    { icon: Wallet, label: "提现审核", href: "/admin/withdrawals" },
    { icon: PieChart, label: "CPS 报表", href: "/admin/reports/cps" },
    { icon: Globe, label: "地理位置", href: "/admin/analytics/geo" },
  ];

  const stats = [
    { label: "总用户数", value: userCount, icon: Users, color: "bg-purple-500" },
    { label: "总职位数", value: jobCount, icon: Briefcase, color: "bg-blue-500" },
    { label: "在招职位", value: activeJobs, icon: TrendingUp, color: "bg-green-500" },
    { label: "公司数", value: companyCount, icon: Building2, color: "bg-orange-500" },
    { label: "博客文章", value: blogCount, icon: FileText, color: "bg-indigo-500" },
    { label: "总浏览量", value: totalViews._sum.viewCount || 0, icon: Eye, color: "bg-pink-500" },
  ];

  const quickActions = [
    { label: "发布新职位", href: "/admin/jobs/new", color: "bg-blue-600 hover:bg-blue-700" },
    { label: "发布博客", href: "/admin/blog/new", color: "bg-green-600 hover:bg-green-700" },
    { label: "管理博客", href: "/admin/blog", color: "bg-indigo-600 hover:bg-indigo-700" },
    { label: "用户管理", href: "/admin/users", color: "bg-purple-600 hover:bg-purple-700" },
    { label: "广告管理", href: "/admin/ads", color: "bg-gray-600 hover:bg-gray-700" },
    { label: "关键词监控", href: "/admin/keywords", color: "bg-pink-600 hover:bg-pink-700" },
    { label: "数据分析", href: "/admin/analytics", color: "bg-orange-600 hover:bg-orange-700" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
                <p className="text-gray-500">欢迎回来，{session.user?.name || "管理员"}</p>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              返回前台
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-1 sticky top-24">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.active
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">快捷操作</h2>
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`px-5 py-2.5 ${action.color} text-white font-medium rounded-xl transition-all flex items-center gap-2`}
                  >
                    <Plus className="w-4 h-4" />
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Jobs & Blogs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Jobs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">最近发布的职位</h2>
                  <Link href="/admin/jobs" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{job.title}</p>
                          <p className="text-sm text-gray-500">{job.companies.name}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">最近发布的博客</h2>
                  <Link href="/admin/blog" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentBlogs.map((blog) => (
                    <div key={blog.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{blog.title}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span>{blog.users.name}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {blog.viewCount}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                            blog.status === "PUBLISHED"
                              ? "bg-green-100 text-green-700"
                              : blog.status === "DRAFT"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {blog.status === "PUBLISHED" ? "已发布" : blog.status === "DRAFT" ? "草稿" : "已归档"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
