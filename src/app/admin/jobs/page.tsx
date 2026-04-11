import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  Briefcase, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  MoreHorizontal
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    companyId?: string;
  }>;
}

const ITEMS_PER_PAGE = 10;

export default async function AdminJobsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1"));
  const search = params.search || "";
  const statusFilter = params.status || "";
  const companyFilter = params.companyId || "";

  // 构建查询条件
  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }
  
  if (statusFilter) {
    where.status = statusFilter;
  }
  
  if (companyFilter) {
    where.companyId = companyFilter;
  }

  // 获取职位列表（带分页）
  const [jobs, totalCount, companies] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: true,
        author: {
          select: { name: true, email: true },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.job.count({ where }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 状态选项
  const statusOptions = [
    { value: "", label: "全部状态" },
    { value: "ACTIVE", label: "招聘中" },
    { value: "INACTIVE", label: "已下架" },
    { value: "EXPIRED", label: "已过期" },
    { value: "DRAFT", label: "草稿" },
  ];

  // 状态显示映射
  const statusDisplay: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "招聘中", className: "bg-green-100 text-green-700" },
    INACTIVE: { label: "已下架", className: "bg-gray-100 text-gray-700" },
    EXPIRED: { label: "已过期", className: "bg-red-100 text-red-700" },
    DRAFT: { label: "草稿", className: "bg-yellow-100 text-yellow-700" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                返回控制台
              </Link>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">职位管理</h1>
                  <p className="text-sm text-gray-500">共 {totalCount} 个职位</p>
                </div>
              </div>
            </div>
            <Link
              href="/admin/jobs/new"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              发布职位
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 筛选栏 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <form className="flex flex-wrap items-center gap-4">
            {/* 搜索 */}
            <div className="flex-1 min-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="搜索职位标题、描述、地点..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* 状态筛选 */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                name="status"
                defaultValue={statusFilter}
                className="pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer min-w-[140px]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 公司筛选 */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                name="companyId"
                defaultValue={companyFilter}
                className="pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="">全部公司</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 筛选按钮 */}
            <button
              type="submit"
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all"
            >
              筛选
            </button>

            {/* 重置按钮 */}
            {(search || statusFilter || companyFilter) && (
              <Link
                href="/admin/jobs"
                className="px-5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl font-medium transition-all"
              >
                重置
              </Link>
            )}
          </form>
        </div>

        {/* 职位列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {jobs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无职位</h3>
              <p className="text-gray-500 mb-4">
                {search || statusFilter || companyFilter
                  ? "没有找到符合条件的职位"
                  : "还没有发布任何职位"}
              </p>
              <Link
                href="/admin/jobs/new"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                发布第一个职位
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        职位信息
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        公司
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        地点
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        申请数
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        发布时间
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobs.map((job) => {
                      const status = statusDisplay[job.status] || { 
                        label: job.status, 
                        className: "bg-gray-100 text-gray-700" 
                      };
                      
                      return (
                        <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {job.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {job.employmentType === "FULL_TIME" && "全职"}
                                  {job.employmentType === "PART_TIME" && "兼职"}
                                  {job.employmentType === "CONTRACT" && "合同"}
                                  {job.employmentType === "INTERNSHIP" && "实习"}
                                  {job.employmentType === "FREELANCE" && "自由职业"}
                                  {job.salaryMin && job.salaryMax && (
                                    <span className="ml-2">
                                      · {job.salaryMin}-{job.salaryMax}K
                                    </span>
                                  )}
                                </p>
                              </div>
                              {job.isFeatured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  精选
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {job.company.logo ? (
                                <img
                                  src={job.company.logo}
                                  alt={job.company.name}
                                  className="w-6 h-6 rounded object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                  {job.company.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm text-gray-700">
                                {job.company.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span>{job.city || job.location}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <form action="/api/admin/jobs/toggle-status" method="POST" className="inline">
                              <input type="hidden" name="jobId" value={job.id} />
                              <button
                                type="submit"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 ${status.className}`}
                                title={job.status === "ACTIVE" ? "点击下架" : "点击上架"}
                              >
                                {job.status === "ACTIVE" ? (
                                  <Eye className="w-3 h-3" />
                                ) : (
                                  <EyeOff className="w-3 h-3" />
                                )}
                                {status.label}
                              </button>
                            </form>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                              {job._count.applications}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500">
                              {new Date(job.createdAt).toLocaleDateString("zh-CN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/jobs/${job.slug}`}
                                target="_blank"
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="查看"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/admin/jobs/edit/${job.id}`}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                                title="编辑"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <form
                                action="/api/admin/jobs/delete"
                                method="POST"
                                className="inline"
                                onSubmit={(e) => {
                                  if (!confirm("确定要删除这个职位吗？此操作不可恢复。")) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                <input type="hidden" name="jobId" value={job.id} />
                                <button
                                  type="submit"
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    显示第 {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} 条，共{" "}
                    {totalCount} 条
                  </p>
                  <div className="flex items-center gap-2">
                    {currentPage > 1 && (
                      <Link
                        href={{
                          pathname: "/admin/jobs",
                          query: {
                            page: currentPage - 1,
                            ...(search && { search }),
                            ...(statusFilter && { status: statusFilter }),
                            ...(companyFilter && { companyId: companyFilter }),
                          },
                        }}
                        className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        上一页
                      </Link>
                    )}
                    
                    {/* 页码 */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // 显示当前页附近的页码
                          const diff = Math.abs(page - currentPage);
                          return diff <= 2 || page === 1 || page === totalPages;
                        })
                        .map((page, index, arr) => {
                          const showEllipsis = index > 0 && arr[index - 1] !== page - 1;
                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-3 py-2 text-gray-400">...</span>
                              )}
                              <Link
                                href={{
                                  pathname: "/admin/jobs",
                                  query: {
                                    page,
                                    ...(search && { search }),
                                    ...(statusFilter && { status: statusFilter }),
                                    ...(companyFilter && { companyId: companyFilter }),
                                  },
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                                  page === currentPage
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                              >
                                {page}
                              </Link>
                            </div>
                          );
                        })}
                    </div>

                    {currentPage < totalPages && (
                      <Link
                        href={{
                          pathname: "/admin/jobs",
                          query: {
                            page: currentPage + 1,
                            ...(search && { search }),
                            ...(statusFilter && { status: statusFilter }),
                            ...(companyFilter && { companyId: companyFilter }),
                          },
                        }}
                        className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                      >
                        下一页
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
