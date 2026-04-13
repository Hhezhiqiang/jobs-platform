"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatSalary } from "@/lib/utils";

interface Application {
  id: string;
  status: string;
  coverLetter?: string;
  appliedAt: string;
  viewedAt?: string;
  respondedAt?: string;
  responseType?: string;
  responseNote?: string;
  withdrewAt?: string;
  job: {
    id: string;
    title: string;
    slug: string;
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency: string;
    company: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待处理", color: "bg-yellow-100 text-yellow-800" },
  VIEWED: { label: "已查看", color: "bg-blue-100 text-blue-800" },
  INTERVIEW: { label: "面试邀请", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "已拒绝", color: "bg-red-100 text-red-800" },
  OFFER: { label: "已录用", color: "bg-purple-100 text-purple-800" },
  WITHDRAWN: { label: "已撤回", color: "bg-gray-100 text-gray-800" },
};

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState("");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchApplications();
    }
  }, [status, router, filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url = filter
        ? `/api/applications?status=${filter}`
        : "/api/applications";
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setApplications(data.applications);
      } else {
        setMessage({ type: "error", text: data.error || "获取申请列表失败" });
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setMessage({ type: "error", text: "获取申请列表失败" });
    } finally {
      setLoading(false);
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    if (!confirm("确定要撤回该申请吗？")) return;

    setWithdrawingId(applicationId);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          status: "WITHDRAWN",
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "申请已撤回" });
        fetchApplications();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "撤回失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "撤回失败，请稍后重试" });
    } finally {
      setWithdrawingId(null);
    }
  };

  const deleteApplication = async (applicationId: string) => {
    if (!confirm("确定要删除该申请记录吗？此操作不可恢复。")) return;

    try {
      const res = await fetch(`/api/applications?id=${applicationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "申请记录已删除" });
        fetchApplications();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "删除失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "删除失败，请稍后重试" });
    }
  };

  const getSalaryText = (app: Application) => {
    return formatSalary(app.job.salaryMin, app.job.salaryMax);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white shadow-sm animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            <div className="hidden md:block w-64 shrink-0">
              <div className="bg-white rounded-lg shadow-sm h-48 animate-pulse" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="bg-white rounded-lg shadow-sm h-20 animate-pulse" />
              <div className="bg-white rounded-lg shadow-sm h-32 animate-pulse" />
              <div className="bg-white rounded-lg shadow-sm h-32 animate-pulse" />
              <div className="bg-white rounded-lg shadow-sm h-32 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← 返回首页
              </Link>
              <h1 className="text-2xl font-bold">我的申请</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">欢迎，{session?.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 侧边导航 */}
          <div className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4 space-y-2">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                📊 概览
              </Link>
              <Link
                href="/dashboard/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                📄 我的简历
              </Link>
              <Link
                href="/dashboard/applications"
                className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
              >
                📋 我的申请
              </Link>
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                ⚙️ 账号设置
              </Link>
            </nav>
          </div>

          {/* 主内容区 */}
          <div className="md:col-span-3">
            {message.text && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* 筛选器 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-gray-700 font-medium">筛选状态：</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  <option value="PENDING">待处理</option>
                  <option value="VIEWED">已查看</option>
                  <option value="INTERVIEW">面试邀请</option>
                  <option value="REJECTED">已拒绝</option>
                  <option value="OFFER">已录用</option>
                  <option value="WITHDRAWN">已撤回</option>
                </select>
                <Link
                  href="/jobs"
                  className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  浏览职位
                </Link>
              </div>
            </div>

            {/* 申请列表 */}
            <div className="bg-white rounded-lg shadow">
              {applications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-600 mb-4">暂无申请记录</p>
                  <Link
                    href="/jobs"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    去浏览职位 →
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {applications.map((app) => (
                    <div key={app.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Link
                            href={`/jobs/${app.job.slug}`}
                            className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                          >
                            {app.job.title}
                          </Link>
                          <Link
                            href={`/companies/${app.job.company.slug}`}
                            className="block text-gray-600 hover:text-gray-800 mt-1"
                          >
                            {app.job.company.name}
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>📍 {app.job.location}</span>
                            <span>💰 {getSalaryText(app)}</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            statusMap[app.status]?.color ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {statusMap[app.status]?.label || app.status}
                        </span>
                      </div>

                      {/* 时间线 */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 overflow-x-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm min-w-[280px]">
                          <div>
                            <p className="text-gray-500">申请时间</p>
                            <p className="font-medium">
                              {new Date(app.appliedAt).toLocaleDateString(
                                "zh-CN"
                              )}
                            </p>
                          </div>
                          {app.viewedAt && (
                            <div>
                              <p className="text-gray-500">HR查看</p>
                              <p className="font-medium">
                                {new Date(app.viewedAt).toLocaleDateString(
                                  "zh-CN"
                                )}
                              </p>
                            </div>
                          )}
                          {app.respondedAt && (
                            <div>
                              <p className="text-gray-500">HR回复</p>
                              <p className="font-medium">
                                {new Date(app.respondedAt).toLocaleDateString(
                                  "zh-CN"
                                )}
                              </p>
                            </div>
                          )}
                          {app.withdrewAt && (
                            <div>
                              <p className="text-gray-500">撤回时间</p>
                              <p className="font-medium">
                                {new Date(app.withdrewAt).toLocaleDateString(
                                  "zh-CN"
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 回复信息 */}
                        {app.responseNote && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-gray-500 mb-1">HR回复</p>
                            <p className="text-gray-800">{app.responseNote}</p>
                          </div>
                        )}

                        {/* 求职信 */}
                        {app.coverLetter && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-gray-500 mb-1">我的求职信</p>
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {app.coverLetter}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-4">
                        {app.status === "PENDING" && (
                          <button
                            onClick={() => withdrawApplication(app.id)}
                            disabled={withdrawingId === app.id}
                            className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                          >
                            {withdrawingId === app.id ? "撤回中..." : "撤回申请"}
                          </button>
                        )}
                        {app.status === "WITHDRAWN" && (
                          <button
                            onClick={() => deleteApplication(app.id)}
                            className="text-gray-500 hover:text-red-600 text-sm"
                          >
                            删除记录
                          </button>
                        )}
                        <Link
                          href={`/jobs/${app.job.slug}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          查看职位详情 →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
