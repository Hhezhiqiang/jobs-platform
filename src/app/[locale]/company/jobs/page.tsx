"use client";

import type { jobs } from "@prisma/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "ACTIVE", label: "招聘中" },
  { value: "INACTIVE", label: "已下架" },
  { value: "DRAFT", label: "草稿" },
];

export default function CompanyJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<jobs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) {
        params.set("status", statusFilter);
      }
      const query = params.toString();
      const res = await fetch(`/api/company/jobs${query ? `?${query}` : ""}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setJobs(data.jobs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "获取职位列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/company/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm("确定要删除这个职位吗？此操作不可撤销。")) {
      return;
    }

    try {
      const res = await fetch(`/api/company/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      ACTIVE: { text: "招聘中", className: "bg-green-100 text-green-800" },
      INACTIVE: { text: "已下架", className: "bg-gray-100 text-gray-600" },
      DRAFT: { text: "草稿", className: "bg-yellow-100 text-yellow-800" },
      EXPIRED: { text: "已过期", className: "bg-red-100 text-red-800" },
    };
    const info = statusMap[status] || { text: status, className: "bg-gray-100" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.className}`}>
        {info.text}
      </span>
    );
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold">职位管理</h1>
            </div>
            <Link
              href="/company/jobs/new"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>发布职位</span>
            </Link>
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
                placeholder="搜索职位..."
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
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-sm text-gray-500">
                共 {filteredJobs.length} 个职位
              </span>
            </div>
          </div>
        </div>

        {/* 职位列表 */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery || statusFilter ? "没有找到匹配的职位" : "暂无发布的职位"}
              <div className="mt-4">
                <Link
                  href="/company/jobs/new"
                  className="text-blue-600 hover:underline"
                >
                  立即发布第一个职位
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                        {getStatusBadge(job.status)}
                        {job.isFeatured && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            推荐
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>{job.location}</span>
                        <span>·</span>
                        <span>
                          发布于{" "}
                          {new Date(job.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>

                      {(job.salaryMin || job.salaryMax) && (
                        <p className="mt-2 text-sm text-green-600">
                          {job.salaryMin && `${job.salaryMin}k`}
                          {job.salaryMin && job.salaryMax && " - "}
                          {job.salaryMax && `${job.salaryMax}k`}
                          {job.salaryCurrency === "CNY" ? "¥" : "$"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/jobs/${job.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="查看"
                      >
                        <Eye className="w-5 h-5 text-gray-500" />
                      </Link>

                      <Link
                        href={`/company/jobs/${job.id}/edit`}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="编辑"
                      >
                        <Edit className="w-5 h-5 text-gray-500" />
                      </Link>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowMenu(showMenu === job.id ? null : job.id)
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreHorizontal className="w-5 h-5 text-gray-500" />
                        </button>

                        {showMenu === job.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowMenu(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                              <button
                                onClick={() => {
                                  toggleJobStatus(job.id, job.status);
                                  setShowMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50"
                              >
                                {job.status === "ACTIVE" ? "下架职位" : "重新上架"}
                              </button>
                              <button
                                onClick={() => {
                                  deleteJob(job.id);
                                  setShowMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50"
                              >
                                删除职位
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}