import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PromoterStatus } from "@prisma/client";

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">← 返回管理后台</Link>
              <h1 className="text-2xl font-bold">推广者管理</h1>
            </div>
            <p className="text-gray-600">共 {total} 位推广者</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 筛选 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form method="GET" className="flex flex-wrap gap-4">
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="搜索姓名/邮箱"
              className="px-4 py-2 border rounded-lg max-w-xs"
            />
            <select name="status" defaultValue={statusFilter || ""} className="px-4 py-2 border rounded-lg">
              <option value="">全部状态</option>
              <option value="PENDING">待审核</option>
              <option value="ACTIVE">正常</option>
              <option value="SUSPENDED">已封禁</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">筛选</button>
          </form>
        </div>

        {/* 列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">姓名/邮箱</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">默认比例</th>
                  <th className="px-4 py-3">可提现</th>
                  <th className="px-4 py-3">累计收益</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promoters.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : p.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {p.status === "ACTIVE" ? "正常" : p.status === "PENDING" ? "待审核" : "已封禁"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.defaultRate.toFixed(0)}%</td>
                    <td className="px-4 py-3">${Number(p.availableBalance).toFixed(2)}</td>
                    <td className="px-4 py-3">${Number(p.totalEarnings).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <form action={updatePromoterStatus} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={p.id} />
                        <select name="status" defaultValue={p.status} className="px-2 py-1 border rounded text-xs">
                          <option value="PENDING">待审核</option>
                          <option value="ACTIVE">通过</option>
                          <option value="SUSPENDED">封禁</option>
                        </select>
                        <input
                          type="number"
                          name="defaultRate"
                          defaultValue={p.defaultRate.toNumber()}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`/admin/promoters?page=${page}&status=${statusFilter || ""}&query=${query}`}
                className={`px-3 py-1 rounded ${
                  page === currentPage ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
