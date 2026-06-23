import type { Prisma } from "@prisma/client";
import { WithdrawalStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { logger } from '@/lib/logger';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
}

const ITEMS_PER_PAGE = 20;

async function updateWithdrawal(formData: FormData) {
  "use server";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error("无权操作");
    }
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    const txHash = formData.get("txHash") as string;
    const remark = formData.get("remark") as string;

    const updateData: Prisma.withdrawal_recordsUpdateInput = { status: status as WithdrawalStatus };
    if (status === "APPROVED" || status === "REJECTED") updateData.reviewedAt = new Date();
    if (status === "TRANSFERRING" || status === "COMPLETED") {
      if (!txHash) throw new Error("缺少 TXID");
      updateData.txHash = txHash;
    }
    if (status === "COMPLETED") updateData.completedAt = new Date();
    if (remark) updateData.remark = remark;

    if (status === "REJECTED") {
      const record = await prisma.withdrawal_records.findUnique({ where: { id } });
      if (record) {
        await prisma.promoters.update({
          where: { id: record.promoterId },
          data: {
            availableBalance: { increment: record.amount },
            withdrawnBalance: { decrement: record.amount },
          },
        });
      }
    }

    await prisma.withdrawal_records.update({ where: { id }, data: updateData });
  } catch (error) {
    logger.error("updateWithdrawal error:", error);
    throw error;
  }
}

const statusBadgeMap: Record<WithdrawalStatus, { label: string; className: string }> = {
  COMPLETED: { label: "已完成", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "已拒绝", className: "bg-red-100 text-red-700" },
  PENDING: { label: "待审核", className: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "已通过", className: "bg-blue-100 text-blue-700" },
  TRANSFERRING: { label: "转账中", className: "bg-purple-100 text-purple-700" },
};

export const dynamic = "force-dynamic";
export default async function AdminWithdrawalsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/auth/login/admin`);
  }

  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || "1"));
  const statusFilter = sp.status || "";

  const where: Prisma.withdrawal_recordsWhereInput = {};
  if (statusFilter) where.status = statusFilter as WithdrawalStatus;

  const [records, total] = await Promise.all([
    prisma.withdrawal_records.findMany({
      where,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: { requestedAt: "desc" },
      include: { promoters: true },
    }),
    prisma.withdrawal_records.count({ where }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">提现管理</h1>
        <p className="text-gray-600">共 {total} 笔提现</p>
      </div>

      {/* 筛选 */}
      <form className="flex gap-3" action={`/${locale}/admin/withdrawals`} method="GET">
        <select name="status" className="px-3 py-2 border rounded-lg text-sm" defaultValue={statusFilter}>
          <option value="">全部状态</option>
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="TRANSFERRING">转账中</option>
          <option value="COMPLETED">已完成</option>
          <option value="REJECTED">已拒绝</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          筛选
        </button>
      </form>

      {/* 数据表格 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">推广者</th>
                <th className="px-4 py-3 text-left font-medium">金额 (USDT)</th>
                <th className="px-4 py-3 text-left font-medium">钱包地址</th>
                <th className="px-4 py-3 text-left font-medium">申请时间</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    暂无提现记录
                  </td>
                </tr>
              ) : (
                records.map((row) => {
                  const s = statusBadgeMap[row.status];
                  return (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.promoters?.name}</div>
                        <div className="text-xs text-gray-500">{row.promoters?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{Number(row.amount).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 font-mono">
                          {row.promoters?.walletAddress || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-500">{row.requestedAt.toLocaleDateString("zh-CN")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.className}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={updateWithdrawal} className="flex flex-wrap items-center gap-2 justify-end">
                          <input type="hidden" name="id" value={row.id} />
                          <select name="status" defaultValue={row.status} className="px-2 py-1 border rounded text-xs">
                            <option value="PENDING">待审核</option>
                            <option value="APPROVED">通过</option>
                            <option value="TRANSFERRING">转账中</option>
                            <option value="COMPLETED">完成</option>
                            <option value="REJECTED">拒绝</option>
                          </select>
                          <input
                            type="text"
                            name="txHash"
                            placeholder="TXID"
                            defaultValue={row.txHash || ""}
                            className="w-28 px-2 py-1 border rounded text-xs"
                          />
                          <input
                            type="text"
                            name="remark"
                            placeholder="备注"
                            className="w-24 px-2 py-1 border rounded text-xs"
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
                  href={`/${locale}/admin/withdrawals?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
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
                    href={`/${locale}/admin/withdrawals?page=${page}${statusFilter ? `&status=${statusFilter}` : ""}`}
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
                  href={`/${locale}/admin/withdrawals?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
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
