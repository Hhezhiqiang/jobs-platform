"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  companyName: string;
  stats: {
    jobsCount: number;
    activeJobsCount: number;
    applicationsCount: number;
    pendingApplicationsCount: number;
  };
  trend: { date: string; display: string; applications: number }[];
  topJobs: {
    id: string;
    title: string;
    slug: string;
    applications: number;
    views: number;
    companyName: string;
  }[];
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function CompanyAnalyticsClient({
  companyName,
  stats,
  trend,
  topJobs,
}: Props) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{companyName} · 数据洞察</h1>
        <p className="text-gray-500 mt-1">近30天的职位表现与简历投递趋势</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总职位数</p>
              <p className="text-3xl font-bold text-gray-900">{stats.jobsCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">招聘中</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeJobsCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">收到简历</p>
              <p className="text-3xl font-bold text-purple-600">{stats.applicationsCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingApplicationsCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 趋势图 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">近30天简历投递趋势</h2>
          <div className="h-80">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="display" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} 份`, "简历"]} />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-gray-50 rounded-lg animate-pulse" />
            )}
          </div>
        </div>

        {/* 职位排行 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">热门职位排行</h2>
          <div className="space-y-4">
            {topJobs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无活跃职位</p>
            ) : (
              topJobs.map((job, idx) => (
                <Link
                  key={job.id}
                  href={`/${locale}/company/jobs/${job.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-gray-100 text-gray-600">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">{job.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {job.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {job.applications}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
