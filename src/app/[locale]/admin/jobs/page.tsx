"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, ChevronLeft, Eye, Edit, Trash2, MapPin, X, ExternalLink, Building, DollarSign, Calendar } from "lucide-react";

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

export default function AdminJobsPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/admin/jobs?page=1`);
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
    fetchJobs();
  }, [params.locale, router]);

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

  const statusMap: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "招聘中", className: "bg-green-100 text-green-700" },
    INACTIVE: { label: "已下架", className: "bg-gray-100 text-gray-700" },
    EXPIRED: { label: "已过期", className: "bg-red-100 text-red-700" },
    DRAFT: { label: "草稿", className: "bg-yellow-100 text-yellow-700" },
  };

  const typeMap: Record<string, string> = {
    FULL_TIME: "全职",
    PART_TIME: "兼职",
    CONTRACT: "合同",
    INTERNSHIP: "实习",
    FREELANCE: "自由职业",
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">加载中...</p></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-4 h-4" /> 返回
              </Link>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">职位管理</h1>
                  <p className="text-sm text-gray-500">共 {totalCount} 个职位</p>
                </div>
              </div>
            </div>
            <Link href="/admin/jobs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium">
              + 发布职位
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {jobs.length === 0 ? (
            <div className="py-16 text-center text-gray-500">暂无职位</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">职位</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">公司</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">地点</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">申请数</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobs.map((job) => {
                    const status = statusMap[job.status] || { label: job.status, className: "bg-gray-100" };
                    return (
                      <tr key={job.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{job.title}</p>
                          <p className="text-xs text-gray-500">
                            {typeMap[job.employmentType]}
                            {job.salaryMin && job.salaryMax && ` · ${job.salaryMin}-${job.salaryMax}K`}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{job.companies?.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 inline text-gray-400 mr-1" />
                          {job.city || job.location}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{job._count?.job_applications || 0}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* 查看详情按钮 */}
                            <button 
                              onClick={() => handleViewJob(job.id)}
                              className="p-1.5 text-blue-600 hover:text-blue-700"
                              title="查看职位详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {/* 前台详情页 - 使用 slug 或回退到搜索 */}
                            <Link 
                              href={`/jobs/${job.title}`} 
                              target="_blank" 
                              className="p-1.5 text-gray-600 hover:text-gray-700"
                              title="打开前台页面"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            
                            {/* 编辑按钮 - Adzuna 职位显示为灰色 */}
                            {job.title.startsWith('adzuna-') || job.title.includes('Adzuna') ? (
                              <span className="p-1.5 text-gray-300 cursor-not-allowed" title="API 同步职位不可编辑">
                                <Edit className="w-4 h-4" />
                              </span>
                            ) : (
                              <Link href={`/admin/jobs/edit/${job.id}`} className="p-1.5 text-indigo-600 hover:text-indigo-700">
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}
                            
                            {/* 删除按钮 */}
                            <button className="p-1.5 text-red-600 hover:text-red-700" title="删除职位">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* 职位详情弹窗 */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">职位详情</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-6">
              {/* 基本信息 */}
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
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${statusMap[selectedJob.status]?.className}`}>
                    {statusMap[selectedJob.status]?.label}
                  </span>
                </div>
              </div>

              {/* AI 解析内容 */}
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

              {/* 外部链接 */}
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

              {/* 元数据 */}
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
