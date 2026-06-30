"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Building2, Briefcase, Users, Clock, ChevronRight, Plus } from "lucide-react";

type DashboardData = {
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
    jobs: { id: string; title: string; slug: string } | null;
    users: { id: string; name: string | null; email: string | null } | null;
  }>;
  recentJobs: Array<{
    id: string;
    title: string;
    location: string | null;
    status: string;
    createdAt: string;
  }>;
};

function getLocaleFromPathname(pathname: string) {
  return pathname.startsWith("/en") ? "en" : "zh";
}

export default function CompanyDashboardPage() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const locale = getLocaleFromPathname(pathname);

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
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      PENDING: { text: "待审核", className: "bg-yellow-100 text-yellow-800" },
      APPROVED: { text: "已通过", className: "bg-green-100 text-green-800" },
      REJECTED: { text: "已拒绝", className: "bg-red-100 text-red-800" },
      SUSPENDED: { text: "已暂停", className: "bg-gray-100 text-gray-800" },
    };
    const info = map[status] || { text: status, className: "bg-gray-100 text-gray-800" };
    return <span className={`rounded-full px-2 py-1 text-xs font-medium ${info.className}`}>{info.text}</span>;
  };

  const getApplicationStatusText = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "待处理",
      VIEWED: "已查看",
      INTERVIEW: "面试",
      REJECTED: "不合适",
      OFFER: "录用",
      WITHDRAWN: "已撤回",
    };
    return map[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-5xl space-y-6 px-4">
          <div className="h-16 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-white shadow-sm" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-xl bg-white shadow-sm" />
            <div className="h-64 animate-pulse rounded-xl bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h3 className="mb-2 text-lg font-bold text-gray-900">加载失败</h3>
          <p className="mb-6 text-gray-500">{error}</p>
          <div className="flex justify-center gap-3">
            <button onClick={fetchDashboardData} className="rounded-xl bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
              重试
            </button>
            <Link href={`/${locale}`} className="rounded-xl bg-gray-100 px-6 py-2 text-gray-700 hover:bg-gray-200">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {data.company?.logo ? (
                <Image src={data.company.logo} alt={data.company.name} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" unoptimized />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{data.company?.name || "企业 Dashboard"}</h1>
                <div className="mt-1 flex items-center gap-2">
                  {data.company?.verificationStatus && getStatusBadge(data.company.verificationStatus)}
                  <span className="text-sm text-gray-500">
                    角色: {data.memberRole === "ADMIN" ? "管理员" : "招聘成员"}
                  </span>
                </div>
              </div>
            </div>

            <Link href={`/${locale}/company/jobs/new`} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              <span>发布职位</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard title="总职位数" value={data.stats.jobsCount} icon={Briefcase} colorClass="bg-blue-100 text-blue-600" />
          <StatCard title="在招职位" value={data.stats.activeJobsCount} icon={Briefcase} colorClass="bg-green-100 text-green-600" />
          <StatCard title="收到申请" value={data.stats.applicationsCount} icon={Users} colorClass="bg-purple-100 text-purple-600" />
          <StatCard title="待处理" value={data.stats.pendingApplicationsCount} icon={Clock} colorClass="bg-orange-100 text-orange-600" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <SectionCard title="最近收到的申请" href={`/${locale}/company/applications`} linkLabel="查看全部">
            {data.recentApplications.length > 0 ? (
              data.recentApplications.map((app) => (
                <Link key={app.id} href={`/${locale}/company/applications/${app.id}`} className="block px-6 py-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{app.users?.name || app.users?.email || "匿名用户"}</p>
                      <p className="text-sm text-gray-500">申请职位: {app.jobs?.title || "-"}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(app.appliedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      app.status === "PENDING" ? "bg-yellow-100 text-yellow-800"
                      : app.status === "VIEWED" ? "bg-blue-100 text-blue-800"
                      : app.status === "INTERVIEW" ? "bg-purple-100 text-purple-800"
                      : app.status === "OFFER" ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                    }`}>
                      {getApplicationStatusText(app.status)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">暂无申请</div>
            )}
          </SectionCard>

          <SectionCard title="最近发布的职位" href={`/${locale}/company/jobs`} linkLabel="查看全部">
            {data.recentJobs.length > 0 ? (
              data.recentJobs.map((job) => (
                <Link key={job.id} href={`/${locale}/company/jobs/${job.id}`} className="block px-6 py-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.location || "-"}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        发布于 {new Date(job.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${job.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {job.status === "ACTIVE" ? "招聘中" : "已下架"}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                暂无职位
                <div className="mt-4">
                  <Link href={`/${locale}/company/jobs/new`} className="text-blue-600 hover:underline">
                    立即发布职位
                  </Link>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: number;
  icon: typeof Briefcase;
  colorClass: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Link href={href} className="flex items-center text-sm text-blue-600 hover:underline">
          {linkLabel} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  );
}
