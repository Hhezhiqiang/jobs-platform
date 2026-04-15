"use client";

import type { jobs, job_applications } from "@prisma/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

interface DashboardData {
  company: {
    id: string;
    name: string;
    slug: string;
    verificationStatus: string;
    logo?: string;
  } | null;
  memberRole: string | null;
  stats: {
    jobsCount: number;
    activeJobsCount: number;
    applicationsCount: number;
    pendingApplicationsCount: number;
  };
  recentApplications: (job_applications & { job: jobs })[];
  recentJobs: jobs[];
}

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/company/dashboard");
      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login/company?callbackUrl=/company/dashboard");
          return;
        }
        if (result.needRegister) {
          router.push("/company/register");
          return;
        }
        throw new Error(result.error);
      }

      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "获取数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      PENDING: { text: "待审核", className: "bg-yellow-100 text-yellow-800" },
      APPROVED: { text: "已通过", className: "bg-green-100 text-green-800" },
      REJECTED: { text: "已拒绝", className: "bg-red-100 text-red-800" },
      SUSPENDED: { text: "已暂停", className: "bg-gray-100 text-gray-800" },
    };
    const statusInfo = statusMap[status] || { text: status, className: "bg-gray-100" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getApplicationStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "待处理",
      VIEWED: "已查看",
      INTERVIEW: "面试",
      REJECTED: "不合适",
      OFFER: "录用",
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-5xl px-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm h-16 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl shadow-sm h-24 animate-pulse" />)}
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="text-blue-600 hover:underline"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {data?.company?.logo ? (
                <Image
                  src={data.company.logo}
                  alt={data.company.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
                >
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {data?.company?.name || "企业 Dashboard"}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  {data?.company?.verificationStatus &&
                    getStatusBadge(data.company.verificationStatus)}
                  <span className="text-sm text-gray-500">
                    角色: {data?.memberRole === "ADMIN" ? "管理员" : "招聘专员"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/company/jobs/new"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>发布职位</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总职位数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.stats.jobsCount || 0}
                </p>
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
                <p className="text-2xl font-bold text-green-600">
                  {data?.stats.activeJobsCount || 0}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {data?.stats.applicationsCount || 0}
                </p>
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
                <p className="text-2xl font-bold text-orange-600">
                  {data?.stats.pendingApplicationsCount || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 最近申请 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">最近收到的简历</h2>
              <Link
                href="/company/applications"
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y">
              {(data?.recentApplications?.length || 0) > 0 ? (
                data?.recentApplications?.map((app) => (
                  <Link
                    key={app.id}
                    href={`/company/applications/${app.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {app.user.name || app.user.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          申请职位: {app.jobs.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(app.appliedAt).toLocaleDateString("zh-CN")}
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
                <div className="px-6 py-8 text-center text-gray-500">
                  暂无收到的简历
                </div>
              )}
            </div>
          </div>

          {/* 最近职位 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">最近发布的职位</h2>
              <Link
                href="/company/jobs"
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y">
              {(data?.recentJobs?.length || 0) > 0 ? (
                data?.recentJobs?.map((job) => (
                  <Link
                    key={job.id}
                    href={`/company/jobs/${job.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">
                          {job.location} · {job._count.job_applications} 份简历
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          发布于{" "}
                          {new Date(job.createdAt).toLocaleDateString("zh-CN")}
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
                    <Link
                      href="/company/jobs/new"
                      className="text-blue-600 hover:underline"
                    >
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