"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronLeft,
  Mail,
  Phone,
  FileText,
  Clock,
  CheckSquare,
  Square,
  Download,
} from "lucide-react";

type ApplicationStatus = "PENDING" | "VIEWED" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN";

type ApplicationRow = {
  id: string;
  status: ApplicationStatus | string;
  appliedAt: string;
  resumeId?: string | null;
  coverLetter?: string | null;
  jobs: { id: string; title: string; slug: string } | null;
  users: { id: string; name: string | null; email: string | null; phone: string | null } | null;
};

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "PENDING", label: "待处理" },
  { value: "VIEWED", label: "已查看" },
  { value: "INTERVIEW", label: "面试" },
  { value: "OFFER", label: "录用" },
  { value: "REJECTED", label: "不合适" },
] as const;

export default function CompanyApplicationsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50">加载中...</div>}>
      <CompanyApplicationsContent />
    </Suspense>
  );
}

function CompanyApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams?.get("status") || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    void fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/company/applications${params.toString() ? `?${params.toString()}` : ""}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "获取申请列表失败");
      }

      setApplications((data.applications || []) as ApplicationRow[]);
      setSelectedIds(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "获取申请列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      if (!q) return true;
      const name = app.users?.name || "";
      const email = app.users?.email || "";
      const title = app.jobs?.title || "";
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || title.toLowerCase().includes(q);
    });
  }, [applications, searchQuery]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      PENDING: { text: "待处理", className: "bg-yellow-100 text-yellow-800" },
      VIEWED: { text: "已查看", className: "bg-blue-100 text-blue-800" },
      INTERVIEW: { text: "面试", className: "bg-purple-100 text-purple-800" },
      OFFER: { text: "录用", className: "bg-green-100 text-green-800" },
      REJECTED: { text: "不合适", className: "bg-gray-100 text-gray-700" },
      WITHDRAWN: { text: "已撤回", className: "bg-slate-100 text-slate-700" },
    };
    const info = map[status] || { text: status, className: "bg-gray-100 text-gray-700" };
    return <span className={`rounded-full px-2 py-1 text-xs font-medium ${info.className}`}>{info.text}</span>;
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (filteredApplications.length > 0 && selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
  };

  const handleBulkUpdate = async (newStatus: Exclude<ApplicationStatus, "WITHDRAWN">) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      const res = await fetch("/api/company/applications/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "批量更新失败");

      setApplications((prev) => prev.map((app) => (selectedIds.has(app.id) ? { ...app, status: newStatus } : app)));
      setSelectedIds(new Set());
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "批量更新失败");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleExport = () => {
    const rows: Record<string, string>[] = filteredApplications.map((app) => ({
      姓名: app.users?.name || "",
      邮箱: app.users?.email || "",
      电话: app.users?.phone || "",
      职位: app.jobs?.title || "",
      状态: String(app.status),
      投递时间: new Date(app.appliedAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN"),
    }));

    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((key) => `"${String(row[key]).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `申请列表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allSelected = filteredApplications.length > 0 && selectedIds.size === filteredApplications.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-100">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">收到的申请</h1>
                <p className="text-sm text-gray-500">共 {filteredApplications.length} 条</p>
              </div>
            </div>
            <Link href={`/${locale}/company/jobs/new`} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              发布职位
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索姓名、邮箱或职位"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
                <Download className="h-4 w-4" />
                导出
              </button>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <span className="text-sm text-gray-600">已选择 {selectedIds.size} 项</span>
              {(["VIEWED", "INTERVIEW", "REJECTED"] as const).map((status) => (
                <button
                  key={status}
                  disabled={bulkUpdating}
                  onClick={() => handleBulkUpdate(status)}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  标记为 {statusOptions.find((opt) => opt.value === status)?.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {isLoading ? (
            <div className="space-y-4 p-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery || statusFilter ? "没有找到匹配的申请" : "暂无收到的申请"}
            </div>
          ) : (
            <div className="divide-y">
              <div className="flex items-center gap-3 bg-gray-50 px-6 py-3">
                <button onClick={toggleSelectAll} className="flex items-center">
                  {allSelected ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5 text-gray-400" />}
                </button>
                <span className="text-sm text-gray-600">全选</span>
              </div>

              {filteredApplications.map((app) => (
                <div key={app.id} className="flex items-start gap-3 px-6 py-5 transition-colors hover:bg-gray-50">
                  <button onClick={() => toggleSelect(app.id)} className="mt-1">
                    {selectedIds.has(app.id) ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5 text-gray-400" />}
                  </button>

                  <Link href={`/${locale}/company/applications/${app.id}`} className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{app.users?.name || "匿名用户"}</h3>
                          {getStatusBadge(app.status)}
                        </div>

                        <p className="mb-2 font-medium text-blue-600">{app.jobs?.title || "未知职位"}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {app.users?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{app.users.email}</span>
                            </span>
                          )}
                          {app.users?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{app.users.phone}</span>
                            </span>
                          )}
                          {app.resumeId && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>已上传简历</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(app.appliedAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                        </div>

                        {app.coverLetter && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{app.coverLetter}</p>}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
