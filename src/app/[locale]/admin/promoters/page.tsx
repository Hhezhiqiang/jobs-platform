import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PromoterStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    status?: PromoterStatus;
    query?: string;
  }>;
}

const ITEMS_PER_PAGE = 20;

async function updatePromoterStatus(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("无权操作");
  }
  const id = formData.get("id") as string;
  const status = formData.get("status") as PromoterStatus;
  const defaultRate = formData.get("defaultRate") as string;
  if (!id) throw new Error("参数不完整");
  const data: Prisma.promotersUpdateInput = {};
  if (status) data.status = status;
  if (defaultRate) data.defaultRate = Number(defaultRate);
  await prisma.promoters.update({ where: { id }, data });
}

const statusBadgeMap: Record<PromoterStatus, { label: string; className: string }> = {
  ACTIVE: { label: "正常", className: "bg-green-100 text-green-700" },
  PENDING: { label: "待审核", className: "bg-yellow-100 text-yellow-700" },
  SUSPENDED: { label: "已封禁", className: "bg-red-100 text-red-700" },
};

export const dynamic = "force-dynamic";
export default async function AdminPromotersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/auth/login/admin`);
  }

  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || "1"));
  const statusFilter = sp.status;
  const query = sp.query || "";

  const where: Prisma.promotersWhereInput = {};
  if (statusFilter) where.status = statusFilter;
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  const [promoters, total] = await Promise.all([
    prisma.promoters.findMany({
      where,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: "desc" },
    }),
    prisma.promoters.count({ where }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">推广者管理</h1>
        <p className="text-gray-600">共 {total} 位推广者</p>
      </div>

      {/* 搜索筛选 */}
      <form className="flex gap-3" action={`/${locale}/admin/promoters`} method="GET">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="搜索姓名/邮箱"
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select name="status" className="px-3 py-2 border rounded-lg text-sm" defaultValue={statusFilter || ""}>
          <option value="">全部状态</option>
          <option value="PENDING">待审核</option>
          <option value="ACTIVE">正常</option>
          <option value="SUSPENDED">已封禁</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          搜索
        </button>
      </form>

      {/* 数据表格 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">姓名/邮箱</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">默认比例</th>
                <th className="px-4 py-3 text-left font-medium">可提现</th>
                <th className="px-4 py-3 text-left font-medium">累计收益</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {promoters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    暂无推广者数据
                  </td>
                </tr>
              ) : (
                promoters.map((row) => {
                  const s = statusBadgeMap[row.status];
                  return (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-gray-500">{row.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.className}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.defaultRate.toFixed(0)}%</td>
                      <td className="px-4 py-3">${Number(row.availableBalance).toFixed(2)}</td>
                      <td className="px-4 py-3">${Number(row.totalEarnings).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <form action={updatePromoterStatus} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={row.id} />
                          <select name="status" defaultValue={row.status} className="px-2 py-1 border rounded text-xs">
                            <option value="PENDING">待审核</option>
                            <option value="ACTIVE">通过</option>
                            <option value="SUSPENDED">封禁</option>
                          </select>
                          <input
                            type="number"
                            name="defaultRate"
                            defaultValue={Number(row.defaultRate)}
                            min={1}
                            max={98}
                            className="w-16 px-2 py-1 border rounded text-xs"
                          />
                          <button type="submit" className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                            更新
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">第 {currentPage} 页，共 {totalPages} 页</p>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/${locale}/admin/promoters?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ""}${query ? `&query=${query}` : ""}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <Link
                    key={page}
                    href={`/${locale}/admin/promoters?page=${page}${statusFilter ? `&status=${statusFilter}` : ""}${query ? `&query=${query}` : ""}`}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      page === currentPage ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </Link>
                );
              })}
              {currentPage < totalPages && (
                <Link
                  href={`/${locale}/admin/promoters?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ""}${query ? `&query=${query}` : ""}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
