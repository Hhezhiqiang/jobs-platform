"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "PENDING", label: "待处理" },
  { value: "VIEWED", label: "已查看" },
  { value: "INTERVIEW", label: "面试" },
  { value: "OFFER", label: "录用" },
  { value: "REJECTED", label: "不合适" },
];

export default function CompanyApplicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>}>
      <CompanyApplicationsContent />
    </Suspense>
  );
}

function CompanyApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) {
        params.set("status", statusFilter);
      }
      const query = params.toString();
      const res = await fetch(`/api/company/applications${query ? `?${query}` : ""}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setApplications(data.applications);
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      PENDING: { text: "待处理", className: "bg-yellow-100 text-yellow-800" },
      VIEWED: { text: "已查看", className: "bg-blue-100 text-blue-800" },
      INTERVIEW: { text: "面试", className: "bg-purple-100 text-purple-800" },
      OFFER: { text: "录用", className: "bg-green-100 text-green-800" },
      REJECTED: { text: "不合适", className: "bg-gray-100 text-gray-600" },
    };
    const info = statusMap[status] || { text: status, className: "bg-gray-100" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.className}`}>
        {info.text}
      </span>
    );
  };

  const filteredApplications = applications.filter(
    (app) =>
      app.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobs.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length && filteredApplications.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
    }
  };

  const handleBulkUpdate = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      const res = await fetch("/api/company/applications/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), status: newStatus }),
      });
      const json = await res.json();
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            selectedIds.has(app.id) ? { ...app, status: newStatus } : app
          )
        );
        setSelectedIds(new Set());
      } else {
        alert(json.error || "批量更新失败");
      }
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleExport = () => {
    const rows = filteredApplications.map((app) => ({
      姓名: app.user.name || "",
      邮箱: app.user.email || "",
      电话: app.user.phone || "",
      职位: app.jobs.title || "",
      状态: app.status,
      投递时间: new Date(app.appliedAt).toLocaleString("zh-CN"),
    }));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `简历导出_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allSelected =
    filteredApplications.length > 0 && selectedIds.size === filteredApplications.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">收到的简历</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选栏 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索候选人或职位..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value) {
                      params.set("status", e.target.value);
                    } else {
                      params.delete("status");
                    }
                    router.push(`?${params.toString()}`);
                  }}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" /> 导出
              </button>

              <span className="text-sm text-gray-500">
                共 {filteredApplications.length} 条
              </span>
            </div>
          </div>

          {/* 批量操作栏 */}
          {selectedIds.size > 0 && (
            <div className="mt-4 flex items-center gap-3 pt-4 border-t">
              <span className="text-sm text-gray-600">已选择 {selectedIds.size} 项</span>
              <div className="flex items-center gap-2">
                {["VIEWED", "INTERVIEW", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    disabled={bulkUpdating}
                    onClick={() => handleBulkUpdate(s)}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
                  >
                    标记为{statusOptions.find((o) => o.value === s)?.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 申请列表 */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery || statusFilter
                ? "没有找到匹配的简历"
                : "暂无收到的简历"}
            </div>
          ) : (
            <div className="divide-y">
              {/* 表头 */}
              <div className="px-6 py-3 bg-gray-50 flex items-center gap-3">
                <button onClick={toggleSelectAll} className="flex items-center">
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <span className="text-sm text-gray-600">全选</span>
              </div>

              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-start gap-3 px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => toggleSelect(app.id)}
                    className="mt-1"
                  >
                    {selectedIds.has(app.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <Link href={`/company/applications/${app.id}`} className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {app.user.name || "匿名用户"}
                          </h3>
                          {getStatusBadge(app.status)}
                        </div>

                        <p className="text-blue-600 font-medium mb-2">
                          {app.jobs.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {app.user.email && (
                            <span className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span>{app.user.email}</span>
                            </span>
                          )}
                          {app.user.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{app.user.phone}</span>
                            </span>
                          )}
                          {app.resume && (
                            <span className="flex items-center space-x-1">
                              <FileText className="w-4 h-4" />
                              <span>已上传简历</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(app.appliedAt).toLocaleDateString("zh-CN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                        </div>

                        {app.coverLetter && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {app.coverLetter}
                          </p>
                        )}
                      </div>

                      <div className="ml-4">
                        <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
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
