import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  FileText,
  Users,
  BarChart3,
  TrendingUp,
  Wallet,
  PieChart,
  Globe,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

// 动态导入客户端组件（避免SSR问题）
const GeoAnalyticsClient = dynamic(
  () => import("./components/geo-analytics-client").then((mod) => mod.GeoAnalyticsClient),
  { 
    ssr: false, 
    loading: () => (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500">加载地理位置数据中...</p>
        </div>
      </div>
    )
  }
);

export const metadata: Metadata = {
  title: "地理位置分析 | 管理员控制台",
  description: "查看用户国家来源、城市分布和IP访问统计",
  robots: { index: false, follow: false },
};

export default async function GeoAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/login/admin");
  }

  const navItems = [
    { icon: LayoutDashboard, label: "概览", href: "/admin" },
    { icon: Briefcase, label: "职位管理", href: "/admin/jobs" },
    { icon: Building2, label: "公司管理", href: "/admin/companies" },
    { icon: FileText, label: "博客管理", href: "/admin/blog" },
    { icon: Sparkles, label: "关键词监控", href: "/admin/keywords" },
    { icon: Users, label: "用户管理", href: "/admin/users" },
    { icon: BarChart3, label: "数据分析", href: "/admin/analytics" },
    { icon: Globe, label: "地理位置", href: "/admin/analytics/geo", active: true },
    { icon: TrendingUp, label: "推广者管理", href: "/admin/promoters" },
    { icon: Wallet, label: "提现审核", href: "/admin/withdrawals" },
    { icon: PieChart, label: "CPS 报表", href: "/admin/reports/cps" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/analytics"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">地理位置分析</h1>
                <p className="text-gray-500">查看用户国家来源、城市分布和IP访问统计</p>
              </div>
            </div>
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
                      ? "bg-emerald-50 text-emerald-700 font-medium"
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
          <div className="lg:col-span-3">
            <GeoAnalyticsClient />
          </div>
        </div>
      </main>
    </div>
  );
}
