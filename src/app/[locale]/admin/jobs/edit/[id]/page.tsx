import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, Save } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditJobPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/auth/login/admin`);
  }

  const { id } = await params;

  // 获取职位信息
  const job = await prisma.jobs.findUnique({
    where: { id },
    include: {
      companies: true,
    },
  });

  if (!job) {
    notFound();
  }

  // 获取所有公司（用于选择）
  const companies = await prisma.companies.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/jobs"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                返回职位列表
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">编辑职位</h1>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <form
          action="/api/admin/jobs/update"
          method="POST"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <input type="hidden" name="jobId" value={job.id} />

          {/* 基本信息 */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  职位标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={job.title}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="例如：高级前端工程师"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属公司 <span className="text-red-500">*</span>
                </label>
                <select
                  name="companyId"
                  defaultValue={job.companyId}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工作类型
                </label>
                <select
                  name="employmentType"
                  defaultValue={job.employmentType}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="FULL_TIME">全职</option>
                  <option value="PART_TIME">兼职</option>
                  <option value="CONTRACT">合同</option>
                  <option value="INTERNSHIP">实习</option>
                  <option value="FREELANCE">自由职业</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  经验要求
                </label>
                <select
                  name="experience"
                  defaultValue={job.experience}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="ENTRY">初级（1-3年）</option>
                  <option value="MID">中级（3-5年）</option>
                  <option value="SENIOR">高级（5-8年）</option>
                  <option value="EXECUTIVE">专家（8年以上）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  城市 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  defaultValue={job.city || ""}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="例如：北京"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细地址
                </label>
                <input
                  type="text"
                  name="location"
                  defaultValue={job.location}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="例如：朝阳区建国路88号"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  申请链接 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="applyUrl"
                  defaultValue={job.applyUrl}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* 薪资信息 */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">薪资信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最低薪资
                </label>
                <input
                  type="number"
                  name="salaryMin"
                  defaultValue={job.salaryMin || ""}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="例如：15000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最高薪资
                </label>
                <input
                  type="number"
                  name="salaryMax"
                  defaultValue={job.salaryMax || ""}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="例如：25000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  薪资货币
                </label>
                <select
                  name="salaryCurrency"
                  defaultValue={job.salaryCurrency}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="CNY">人民币 (CNY)</option>
                  <option value="USD">美元 (USD)</option>
                  <option value="EUR">欧元 (EUR)</option>
                  <option value="GBP">英镑 (GBP)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 工作模式 */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">工作模式</h2>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isRemote"
                  defaultChecked={job.isRemote}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">支持远程工作</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isHybrid"
                  defaultChecked={job.isHybrid}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">混合办公</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={job.isFeatured}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">精选职位</span>
              </label>
            </div>
          </div>

          {/* 职位描述 */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">职位描述</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  职位简介 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  defaultValue={job.description}
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
                  placeholder="详细描述职位职责、工作内容..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任职要求
                </label>
                <textarea
                  name="requirements"
                  defaultValue={job.requirements || ""}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
                  placeholder="学历、经验、技能等要求..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  福利待遇
                </label>
                <textarea
                  name="benefits"
                  defaultValue={job.benefits || ""}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
                  placeholder="五险一金、带薪年假、股票期权等..."
                />
              </div>
            </div>
          </div>

          {/* 状态设置 */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">状态设置</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                职位状态
              </label>
              <select
                name="status"
                defaultValue={job.status}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="ACTIVE">招聘中</option>
                <option value="INACTIVE">已下架</option>
                <option value="EXPIRED">已过期</option>
                <option value="DRAFT">草稿</option>
              </select>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-6 bg-gray-50 flex items-center justify-between">
            <Link
              href="/admin/jobs"
              className="px-6 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-xl font-medium transition-all"
            >
              取消
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href={`/jobs/${job.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-xl font-medium transition-all"
              >
                预览
              </Link>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm"
              >
                <Save className="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
