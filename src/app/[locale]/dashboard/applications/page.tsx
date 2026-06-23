"use client";
import { useLocale, useTranslations } from "next-intl";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatSalary } from "@/lib/utils";
import { logger } from '@/lib/logger';

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
  jobs: {
    id: string;
    title: string;
    slug: string;
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency: string;
    companies: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VIEWED: "bg-blue-100 text-blue-800",
  INTERVIEW: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  OFFER: "bg-purple-100 text-purple-800",
  WITHDRAWN: "bg-gray-100 text-gray-800",
};

export default function ApplicationsPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.applicationsPage");
  const tNav = useTranslations("dashboard.applicationsPage.nav");
  const tFilter = useTranslations("dashboard.applicationsPage.filter");
  const tEmpty = useTranslations("dashboard.applicationsPage.empty");
  const tTL = useTranslations("dashboard.applicationsPage.timeline");
  const tActs = useTranslations("dashboard.applicationsPage.actions");
  const tSt = useTranslations("dashboard.applicationsPage.status");
  const tMsg = useTranslations("dashboard.applicationsPage.messages");

  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState("");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/login`);
      return;
    }
    if (status === "authenticated") {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url = filter ? `/api/applications?status=${filter}` : "/api/applications";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications);
      } else {
        setMessage({ type: "error", text: data.error || tMsg("fetchFailed") });
      }
    } catch (error) {
      logger.error("Failed to fetch applications:", error);
      setMessage({ type: "error", text: tMsg("fetchFailed") });
    } finally {
      setLoading(false);
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    if (!confirm(tMsg("withdrawConfirm"))) return;
    setWithdrawingId(applicationId);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status: "WITHDRAWN" }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: tMsg("withdrawSuccess") });
        fetchApplications();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || tMsg("withdrawFailed") });
      }
    } catch (error) {
      setMessage({ type: "error", text: tMsg("withdrawRetry") });
    } finally {
      setWithdrawingId(null);
    }
  };

  const deleteApplication = async (applicationId: string) => {
    if (!confirm(tMsg("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/applications?id=${applicationId}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: tMsg("deleteSuccess") });
        fetchApplications();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || tMsg("deleteFailed") });
      }
    } catch (error) {
      setMessage({ type: "error", text: tMsg("deleteRetry") });
    }
  };

  const getSalaryText = (app: Application) => formatSalary(app.jobs.salaryMin, app.jobs.salaryMax);

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
              <Link href={`/${locale}`} className="text-blue-600 hover:text-blue-800">
                {t("backHome")}
              </Link>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{t("welcomeUser", { name: session?.user?.name ?? "" })}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {t("logout")}
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
              <Link href={`/${locale}/dashboard`} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                {tNav("overview")}
              </Link>
              <Link href={`/${locale}/dashboard/profile`} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                {tNav("profile")}
              </Link>
              <Link href={`/${locale}/dashboard/applications`} className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                {tNav("applications")}
              </Link>
              <Link href={`/${locale}/dashboard/settings`} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                {tNav("settings")}
              </Link>
            </nav>
          </div>

          {/* 主内容区 */}
          <div className="md:col-span-3">
            {message.text && (
              <div className={`mb-4 p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {message.text}
              </div>
            )}

            {/* 筛选器 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-gray-700 font-medium">{tFilter("label")}</span>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{tFilter("all")}</option>
                  <option value="PENDING">{tFilter("PENDING")}</option>
                  <option value="VIEWED">{tFilter("VIEWED")}</option>
                  <option value="INTERVIEW">{tFilter("INTERVIEW")}</option>
                  <option value="REJECTED">{tFilter("REJECTED")}</option>
                  <option value="OFFER">{tFilter("OFFER")}</option>
                  <option value="WITHDRAWN">{tFilter("WITHDRAWN")}</option>
                </select>
                <Link href={`/${locale}/jobs`} className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  {t("browseJobs")}
                </Link>
              </div>
            </div>

            {/* 申请列表 */}
            <div className="bg-white rounded-lg shadow">
              {applications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-600 mb-4">{tEmpty("title")}</p>
                  <Link href={`/${locale}/jobs`} className="text-blue-600 hover:text-blue-800">
                    {tEmpty("cta")}
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {applications.map(app => (
                    <div key={app.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Link href={`/${locale}/jobs/${app.jobs.slug}`} className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                            {app.jobs.title}
                          </Link>
                          <Link href={`/${locale}/companies/${app.jobs.companies.slug}`} className="block text-gray-600 hover:text-gray-800 mt-1">
                            {app.jobs.companies.name}
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>📍 {app.jobs.location}</span>
                            <span>💰 {getSalaryText(app)}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${statusColor[app.status] || "bg-gray-100 text-gray-800"}`}>
                          {(() => {
                            const known = ["PENDING", "VIEWED", "INTERVIEW", "REJECTED", "OFFER", "WITHDRAWN"];
                            return known.includes(app.status) ? tSt(app.status) : app.status;
                          })()}
                        </span>
                      </div>

                      {/* 时间线 */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 overflow-x-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm min-w-[280px]">
                          <div>
                            <p className="text-gray-500">{tTL("appliedAt")}</p>
                            <p className="font-medium">
                              {new Date(app.appliedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
                            </p>
                          </div>
                          {app.viewedAt && (
                            <div>
                              <p className="text-gray-500">{tTL("viewedAt")}</p>
                              <p className="font-medium">
                                {new Date(app.viewedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
                              </p>
                            </div>
                          )}
                          {app.respondedAt && (
                            <div>
                              <p className="text-gray-500">{tTL("respondedAt")}</p>
                              <p className="font-medium">
                                {new Date(app.respondedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
                              </p>
                            </div>
                          )}
                          {app.withdrewAt && (
                            <div>
                              <p className="text-gray-500">{tTL("withdrewAt")}</p>
                              <p className="font-medium">
                                {new Date(app.withdrewAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
                              </p>
                            </div>
                          )}
                        </div>

                        {app.responseNote && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-gray-500 mb-1">{tTL("hrResponse")}</p>
                            <p className="text-gray-800">{app.responseNote}</p>
                          </div>
                        )}

                        {app.coverLetter && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-gray-500 mb-1">{tTL("coverLetter")}</p>
                            <p className="text-gray-800 whitespace-pre-wrap">{app.coverLetter}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {app.status === "PENDING" && (
                          <button
                            onClick={() => withdrawApplication(app.id)}
                            disabled={withdrawingId === app.id}
                            className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                          >
                            {withdrawingId === app.id ? tActs("withdrawing") : tActs("withdraw")}
                          </button>
                        )}
                        {app.status === "WITHDRAWN" && (
                          <button
                            onClick={() => deleteApplication(app.id)}
                            className="text-gray-500 hover:text-red-600 text-sm"
                          >
                            {tActs("deleteRecord")}
                          </button>
                        )}
                        <Link href={`/${locale}/jobs/${app.jobs.slug}`} className="text-blue-600 hover:text-blue-800 text-sm">
                          {tActs("viewJob")}
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
