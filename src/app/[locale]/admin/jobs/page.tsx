"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, X, ExternalLink, Building, DollarSign, Calendar } from "lucide-react";
import { DataTable, AdminBadge, AdminPagination, type Column } from "@/components/admin";

type Job = {
  id: string;
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

  const totalPages = Math.ceil(totalCount / 20);

  const fetchJobs = async (page: number = currentPage) => {
    try {
      const res = await fetch(`/api/admin/jobs?page=${page}`);
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
    fetchJobs(1);
  }, [params.locale, router]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchJobs(page);
  };

  const handleViewJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedJob(data.job);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
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
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">职位管理</h1>
          <p className="text-sm text-gray-500">共 {totalCount} 个职位</p>
        </div>
        <Link href="/admin/jobs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium">
          + 发布职位
        </Link>
      </div>

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
                  {row.salaryMin && row.salaryMax && ` · ${row.salaryMin}-${row.salaryMax}K`}
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
          />,
          <Link
            key="preview"
            href={`/jobs/${row.title}`}
            target="_blank"
            className="p-1.5 text-gray-600 hover:text-gray-700"
            title="打开前台页面"
          />,
          row.title.startsWith('adzuna-') || row.title.includes('Adzuna') ? (
            <span key="edit-disabled" className="p-1.5 text-gray-300 cursor-not-allowed" title="API 同步职位不可编辑">
            </span>
          ) : (
            <Link
              key="edit"
              href={`/admin/jobs/edit/${row.id}`}
              className="p-1.5 text-indigo-600 hover:text-indigo-700"
              title="编辑"
            />
          ),
          <button
            key="delete"
            className="p-1.5 text-red-600 hover:text-red-700"
            title="删除职位"
          />,
        ]}
        emptyState="暂无职位"
      />

      {/* 分页 */}
      {totalPages > 1 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/admin/jobs"
        />
      )}

      {/* 职位详情弹窗 */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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
                    <span className="font-semibold">
                      {selectedJob.salaryMin && selectedJob.salaryMax
                        ? `${selectedJob.salaryMin}-${selectedJob.salaryMax}K`
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
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 岗位职责</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.requirements && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-2">✅ 任职要求</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.requirements}</p>
                  </div>
                )}

                {selectedJob.benefits && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">🎁 福利待遇</h4>
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
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
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
