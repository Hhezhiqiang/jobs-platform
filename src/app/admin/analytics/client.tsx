"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  FileText,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  UserPlus,
  Calendar,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatNumber } from "@/lib/utils";

interface AnalyticsData {
  visitStats: {
    dailyStats: Array<{
      date: string;
      dateDisplay: string;
      pv: number;
      uv: number;
    }>;
    summary: {
      totalPV: number;
      totalUV: number;
      avgPV: number;
      avgUV: number;
      pvGrowth: number;
      uvGrowth: number;
    };
  };
  conversionStats: {
    dailyStats: Array<{
      date: string;
      dateDisplay: string;
      views: number;
      applications: number;
      conversionRate: number;
    }>;
    summary: {
      totalViews: number;
      totalApplications: number;
      avgConversionRate: number;
      conversionGrowth: number;
    };
  };
  topJobs: Array<{
    rank: number;
    id: string;
    title: string;
    company: string;
    viewCount: number;
    applicationCount: number;
    conversionRate: number;
    location: string;
    salaryMin: number | null;
    salaryMax: number | null;
  }>;
  userGrowth: {
    dailyStats: Array<{
      date: string;
      dateDisplay: string;
      newUsers: number;
      cumulativeUsers: number;
    }>;
    summary: {
      totalUsers: number;
      totalNewUsers: number;
      avgDailyNewUsers: number;
      growthRate: number;
    };
  };
  jobGrowth: {
    dailyStats: Array<{
      date: string;
      dateDisplay: string;
      newJobs: number;
      activeJobs: number;
    }>;
    summary: {
      totalJobs: number;
      currentActiveJobs: number;
      totalNewJobs: number;
      avgDailyNewJobs: number;
      activeRate: number;
    };
  };
}

interface AnalyticsClientProps {
  data: AnalyticsData;
}

const navItems = [
  { icon: LayoutDashboard, label: "概览", href: "/admin" },
  { icon: Briefcase, label: "职位管理", href: "/admin/jobs" },
  { icon: Building2, label: "公司管理", href: "/admin/companies" },
  { icon: FileText, label: "博客管理", href: "/admin/blog" },
  { icon: Users, label: "用户管理", href: "/admin/users" },
  { icon: BarChart3, label: "数据分析", href: "/admin/analytics", active: true },
];

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

export default function AnalyticsClient({ data }: AnalyticsClientProps) {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
  };

  // 根据时间范围过滤数据
  const getFilteredData = (stats: any[]) => {
    return stats.slice(-timeRange);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle, 
    trend 
  }: { 
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
    trend?: { value: number; positive: boolean };
  }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trend.positive ? "text-green-600" : "text-red-600"}`}>
              {trend.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{trend.value}%</span>
              <span className="text-gray-400 text-xs">vs 上月</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
                <p className="text-gray-500">实时数据监控与分析</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTimeRange(days as 7 | 30 | 90)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      timeRange === days
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {days}天
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                返回后台
              </Link>
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
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="总访问量 (PV)"
                value={formatNumber(data.visitStats.summary.totalPV)}
                icon={Eye}
                color="bg-blue-500"
                subtitle={`日均 ${formatNumber(data.visitStats.summary.avgPV)}`}
                trend={{ value: data.visitStats.summary.pvGrowth, positive: true }}
              />
              <StatCard
                title="申请转化率"
                value={`${data.conversionStats.summary.avgConversionRate}%`}
                icon={Target}
                color="bg-green-500"
                subtitle={`${data.conversionStats.summary.totalApplications} 次申请`}
                trend={{ value: data.conversionStats.summary.conversionGrowth, positive: data.conversionStats.summary.conversionGrowth > 0 }}
              />
              <StatCard
                title="新增用户"
                value={formatNumber(data.userGrowth.summary.totalNewUsers)}
                icon={UserPlus}
                color="bg-purple-500"
                subtitle={`日均 ${data.userGrowth.summary.avgDailyNewUsers} 人`}
                trend={{ value: data.userGrowth.summary.growthRate, positive: true }}
              />
              <StatCard
                title="活跃职位"
                value={data.jobGrowth.summary.currentActiveJobs}
                icon={Briefcase}
                color="bg-orange-500"
                subtitle={`占比 ${data.jobGrowth.summary.activeRate}%`}
                trend={{ value: data.jobGrowth.summary.activeRate, positive: true }}
              />
            </div>

            {/* Visit Trends Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                    访问量趋势
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">PV/UV 每日变化趋势</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getFilteredData(data.visitStats.dailyStats)}>
                    <defs>
                      <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="dateDisplay" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "white", 
                        borderRadius: "8px", 
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Area type="monotone" dataKey="pv" name="浏览量 (PV)" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorPv)" />
                    <Area type="monotone" dataKey="uv" name="访客数 (UV)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Conversion Rate & Job Growth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversion Rate Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MousePointer className="w-5 h-5 text-green-500" />
                      申请转化趋势
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">浏览到申请的转化率</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getFilteredData(data.conversionStats.dailyStats)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="dateDisplay" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} unit="%" />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: "white", 
                          borderRadius: "8px", 
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }}
                        formatter={(value) => [`${value}%`, "转化率"]}
                      />
                      <Line type="monotone" dataKey="conversionRate" name="转化率" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User & Job Growth */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      增长趋势
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">用户与职位增长对比</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getFilteredData(data.userGrowth.dailyStats)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="dateDisplay" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: "white", 
                          borderRadius: "8px", 
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }}
                      />
                      <Bar dataKey="newUsers" name="新增用户" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Jobs Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    热门职位排行
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">申请量最多的职位 TOP10</p>
                </div>
                <Link href="/admin/jobs" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  查看全部 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">排名</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">职位名称</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">公司</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">浏览量</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">申请数</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">转化率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.topJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                            job.rank <= 3 
                              ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {job.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-xs text-gray-500">{job.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{job.company}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-900">{formatNumber(job.viewCount)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-blue-600">{job.applicationCount}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                            job.conversionRate >= 5 ? "text-green-600" : 
                            job.conversionRate >= 2 ? "text-yellow-600" : "text-gray-600"
                          }`}>
                            {job.conversionRate}%
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Job Growth Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    职位增长趋势
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">每日新增职位与活跃职位数量</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getFilteredData(data.jobGrowth.dailyStats)}>
                    <defs>
                      <linearGradient id="colorNewJobs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorActiveJobs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="dateDisplay" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "white", 
                        borderRadius: "8px", 
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Area type="monotone" dataKey="newJobs" name="新增职位" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorNewJobs)" />
                    <Area type="monotone" dataKey="activeJobs" name="活跃职位" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorActiveJobs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
