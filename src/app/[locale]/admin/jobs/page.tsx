"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, X, ExternalLink, Building, DollarSign, Calendar, Briefcase, Eye, Pencil, Trash2 } from "lucide-react";
import { DataTable, AdminBadge, type Column } from "@/components/admin";
import { formatSalary } from "@/lib/utils";
import { logger } from '@/lib/logger';

type Job = {
  id: string;
  slug: string | null;
  title: string;
  status: string;
  location: string;
  city: string | null;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
  companies: { name: string; logo: string | null };
  _count: { job_applications: number };
};

type JobDetail = Job & {
  description?: string;
  requirements?: string;
  benefits?: string;
  applyUrl?: string;
  slug?: string;
};

const statusMap: Record<string, { label: string; variant: "success" | "default" | "error" | "warning" }> = {
  ACTIVE: { label: "招聘中", variant: "success" },
  INACTIVE: { label: "已下架", variant: "default" },
  EXPIRED: { label: "已过期", variant: "error" },
  DRAFT: { label: "草稿", variant: "warning" },
};

const typeMap: Record<string, string> = {
  FULL_TIME: "全职",
  PART_TIME: "兼职",
  CONTRACT: "合同",
  INTERNSHIP: "实习",
  FREELANCE: "自由职业",
};

export default function AdminJobsPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const totalPages = Math.ceil(totalCount / 15);

  const fetchJobs = async (page: number = currentPage, q = query, status = statusFilter) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page) });
      if (q) qs.set("q", q);
      if (status) qs.set("status", status);
      const res = await fetch(`/api/admin/jobs?${qs.toString()}`);
      if (res.status === 401) {
        router.push(`/${params.locale}/auth/login/admin`);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "获取职位列表失败");
      }
      const data = await res.json();
      if (data) {
        setJobs(data.jobs || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1, query, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.locale, query, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchJobs(page, query, statusFilter);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setQuery(searchInput.trim());
  };

  const handleViewJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedJob(data.job);
      }
    } catch (error) {
      logger.error('Failed to fetch job details:', error);
    }
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`确定删除职位「${jobTitle}」？此操作不可恢复。`)) return;
    try {
      const fd = new FormData();
      fd.set("jobId", jobId);
      const res = await fetch(`/api/admin/jobs/delete`, {
        method: "POST",
        body: fd,
        redirect: "manual",
      });
      if (res.ok || res.status === 0 || res.type === "opaqueredirect") {
        await fetchJobs(currentPage, query, statusFilter);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "删除失败");
      }
    } catch (err) {
      logger.error("Delete job error:", err);
      alert("删除失败，请重试");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center"><p className="text-gray-500">加载中...</p></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-4 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aurora 标题栏 */}
      <div className="aurora-card rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">职位管理</h1>
          <p className="text-sm text-gray-500">共 {totalCount} 个职位</p>
        </div>
        <Link href={`/${params.locale}/admin/jobs/new`} className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#6366f1]/25 text-white px-5 py-2.5 rounded-xl font-medium transition-all">
          + 发布职位
        </Link>
      </div>

      {/* 搜索 + 状态筛选 */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="搜索职位标题、公司、城市..."
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setCurrentPage(1); setStatusFilter(e.target.value); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="ACTIVE">招聘中</option>
          <option value="INACTIVE">已下架</option>
          <option value="EXPIRED">已过期</option>
          <option value="DRAFT">草稿</option>
        </select>
        <button type="submit" className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700">
          搜索
        </button>
      </form>

      {/* 数据表格 */}
      <DataTable
        columns={[
          {
            key: "title",
            label: "职位",
            render: (_val, row) => (
              <div>
                <p className="font-semibold text-gray-900">{row.title}</p>
                <p className="text-xs text-gray-500">
                  {typeMap[row.employmentType]}
                  {row.salaryMin && row.salaryMax && ` · ${formatSalary(row.salaryMin, row.salaryMax)}`}
                </p>
              </div>
            ),
          },
          {
            key: "companies.name",
            label: "公司",
            render: (_val, row) => (
              <span className="text-sm text-gray-700">{row.companies?.name}</span>
            ),
          },
          {
            key: "location",
            label: "地点",
            render: (_val, row) => (
              <span className="text-sm text-gray-600">
                <MapPin className="w-3.5 h-3.5 inline text-gray-400 mr-1" />
                {row.city || row.location}
              </span>
            ),
          },
          {
            key: "status",
            label: "状态",
            render: (_val, row) => {
              const s = statusMap[row.status] || { label: row.status, variant: "default" as const };
              return <AdminBadge variant={s.variant}>{s.label}</AdminBadge>;
            },
          },
          {
            key: "applications",
            label: "申请数",
            render: (_val, row) => <span className="text-sm">{row._count?.job_applications || 0}</span>,
          },
        ]}
        data={jobs}
        actions={(row) => [
          <button
            key="view"
            onClick={() => handleViewJob(row.id)}
            className="p-1.5 text-blue-600 hover:text-blue-700"
            title="查看职位详情"
          >
            <Eye className="w-4 h-4" />
          </button>,
          <Link
            key="preview"
            href={`/${params.locale}/jobs/${row.slug || row.id}`}
            target="_blank"
            className="p-1.5 text-gray-600 hover:text-gray-700"
            title="打开前台页面"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>,
          row.title.startsWith('adzuna-') || row.title.includes('Adzuna') ? (
            <span key="edit-disabled" className="p-1.5 text-gray-300 cursor-not-allowed" title="API 同步职位不可编辑">
              <Pencil className="w-4 h-4" />
            </span>
          ) : (
            <Link
              key="edit"
              href={`/${params.locale}/admin/jobs/edit/${row.id}`}
              className="p-1.5 text-indigo-600 hover:text-indigo-700"
              title="编辑"
            >
              <Pencil className="w-4 h-4" />
            </Link>
          ),
          <button
            key="delete"
            onClick={() => handleDeleteJob(row.id, row.title)}
            className="p-1.5 text-red-600 hover:text-red-700"
            title="删除职位"
          >
            <Trash2 className="w-4 h-4" />
          </button>,
        ]}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-8 text-gray-500">
            <Briefcase className="w-12 h-12 text-gray-300" />
            <div className="text-base font-medium text-gray-700">
              {query || statusFilter ? "没有找到匹配的职位" : "暂无职位"}
            </div>
            <div className="text-sm">
              {query || statusFilter
                ? "试试调整搜索关键词或状态筛选。"
                : "还没有发布任何职位。"}
            </div>
            {!query && !statusFilter && (
              <Link
                href={`/${params.locale}/admin/jobs/new`}
                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4f46e5]"
              >
                发布第一个职位
              </Link>
            )}
          </div>
        }
      />

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}

      {/* Aurora 职位详情弹窗 */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedJob(null)}>
          <div
            className="aurora-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Aurora top gradient bar */}
            <div className="h-1 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4] rounded-t-2xl" />
            
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">职位详情</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedJob.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4" />
                    <span>{selectedJob.companies?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedJob.city || selectedJob.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
                      {selectedJob.salaryMin && selectedJob.salaryMax
                        ? formatSalary(selectedJob.salaryMin, selectedJob.salaryMax)
                        : '面议'}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>{typeMap[selectedJob.employmentType]}</span>
                  </div>
                  {statusMap[selectedJob.status] && (
                    <span className="mt-2 inline-block">
                      <AdminBadge variant={statusMap[selectedJob.status].variant}>
                        {statusMap[selectedJob.status].label}
                      </AdminBadge>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedJob.description && (
                  <div className="bg-[#eef2ff] rounded-xl p-4 border border-[#6366f1]/10">
                    <h4 className="font-semibold text-[#4f46e5] mb-2">📋 岗位职责</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.requirements && (
                  <div className="bg-[#ecfdf5] rounded-xl p-4 border border-[#059669]/10">
                    <h4 className="font-semibold text-[#059669] mb-2">✅ 任职要求</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.requirements}</p>
                  </div>
                )}

                {selectedJob.benefits && (
                  <div className="bg-[#fdf4ff] rounded-xl p-4 border border-[#a855f7]/10">
                    <h4 className="font-semibold text-[#a855f7] mb-2">🎁 福利待遇</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.benefits}</p>
                  </div>
                )}
              </div>

              {selectedJob.applyUrl && (
                <div className="border-t pt-4">
                  <a
                    href={selectedJob.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    前往申请页面
                  </a>
                </div>
              )}

              <div className="border-t pt-4 text-xs text-gray-500">
                <p>职位 ID: {selectedJob.id}</p>
                <p>Slug: {selectedJob.slug}</p>
                <p>创建时间：{new Date(selectedJob.createdAt).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
