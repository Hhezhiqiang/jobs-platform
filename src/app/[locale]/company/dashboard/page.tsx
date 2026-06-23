"use client";

import type { jobs, job_applications, users } from "@prisma/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Briefcase,
  Users,
  Clock,
  ChevronRight,
  Plus,
} from "lucide-react";

function getLocaleFromPathname(): string {
  if (typeof window === "undefined") return "zh";
  const parts = window.location.pathname.split("/");
  if (parts.length >= 2 && (parts[1] === "zh" || parts[1] === "en")) {
    return parts[1];
  }
  return "zh";
}

interface DashboardData {
  company: {
    id: string;
    name: string;
    slug: string;
    verificationStatus: string;
    logo?: string | null;
  } | null;
  memberRole: string | null;
  stats: {
    jobsCount: number;
    activeJobsCount: number;
    applicationsCount: number;
    pendingApplicationsCount: number;
  };
  recentApplications: Array<{
    id: string;
    status: string;
    appliedAt: string;
    job: { id: string; title: string; slug: string } | null;
    user: { id: string; name: string | null; email: string | null } | null;
  }>;
  recentJobs: Array<{
    id: string;
    title: string;
    location: string | null;
    status: string;
    createdAt: string;
  }>;
}

export default function CompanyDashboardPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname?.split("/")[1] || "zh";

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch("/api/company/dashboard");
      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/${locale}/auth/login/company?callbackUrl=/${locale}/company/dashboard`);
          return;
        }
        if (result.needRegister) {
          router.push(`/${locale}/company/register`);
          return;
        }
        throw new Error(result.error || "获取数据失败");
      }

      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "获取数据失败");
    } finally {
      setIsLoading(false);
    }
  }, [locale, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      PENDING: { text: "待审核", className: "bg-yellow-100 text-yellow-800" },
      APPROVED: { text: "已通过", className: "bg-green-100 text-green-800" },
      REJECTED: { text: "已拒绝", className: "bg-red-100 text-red-800" },
      SUSPENDED: { text: "已暂停", className: "bg-gray-100 text-gray-800" },
    };
    const info = statusMap[status] || { text: status, className: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.className}`}>
        {info.text}
      </span>
    );
  };

  const getApplicationStatusText = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "待处理",
      VIEWED: "已查看",
      INTERVIEW: "面试",
      REJECTED: "不合适",
      OFFER: "录用",
    };
    return map[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-5xl px-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm h-16 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm h-24 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm h-64 animate-pulse" />
            <div className="bg-white rounded-xl shadow-sm h-64 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-sm border p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchDashboardData}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
            <Link
              href={`/${locale}`}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">暂无数据</p>
          <Link href={`/${locale}`} className="text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {data.company?.logo ? (
                <Image
                  src={data.company.logo}
                  alt={data.company.name || "Logo"}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {data.company?.name || "企业 Dashboard"}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  {data.company?.verificationStatus &&
                    getStatusBadge(data.company.verificationStatus)}
                  <span className="text-sm text-gray-500">
                    角色: {data.memberRole === "ADMIN" ? "管理员" : "招聘专员"}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/${locale}/company/jobs/new`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>发布职位</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总职位数</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats?.jobsCount ?? 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">招聘中</p>
                <p className="text-2xl font-bold text-green-600">{data.stats?.activeJobsCount ?? 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">收到简历</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats?.applicationsCount ?? 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-2xl font-bold text-orange-600">{data.stats?.pendingApplicationsCount ?? 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">最近收到的简历</h2>
              <Link
                href={`/${locale}/company/applications`}
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y">
              {data.recentApplications && data.recentApplications.length > 0 ? (
                data.recentApplications.map((app) => (
                  <Link
                    key={app.id}
                    href={`/${locale}/company/applications/${app.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {app.user?.name || app.user?.email || "匿名用户"}
                        </p>
                        <p className="text-sm text-gray-500">
                          申请职位: {app.job?.title || "-"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN") : "-"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          app.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : app.status === "VIEWED"
                            ? "bg-blue-100 text-blue-800"
                            : app.status === "INTERVIEW"
                            ? "bg-purple-100 text-purple-800"
                            : app.status === "OFFER"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getApplicationStatusText(app.status)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">暂无收到的简历</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">最近发布的职位</h2>
              <Link
                href={`/${locale}/company/jobs`}
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y">
              {data.recentJobs && data.recentJobs.length > 0 ? (
                data.recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/${locale}/company/jobs/${job.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.location || "-"}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          发布于 {job.createdAt ? new Date(job.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN") : "-"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          job.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {job.status === "ACTIVE" ? "招聘中" : "已下架"}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  暂无发布的职位
                  <div className="mt-4">
                    <Link href={`/${locale}/company/jobs/new`} className="text-blue-600 hover:underline">
                      立即发布职位
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
