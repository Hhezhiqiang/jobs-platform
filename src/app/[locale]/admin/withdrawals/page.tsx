import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
}

const ITEMS_PER_PAGE = 20;

async function updateWithdrawal(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("无权操作");
  }
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const txHash = formData.get("txHash") as string;
  const remark = formData.get("remark") as string;

  const updateData: any = { status };
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
}

export default async function AdminWithdrawalsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/login/admin");
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1"));
  const statusFilter = params.status || "";

  const where: any = {};
  if (statusFilter) where.status = statusFilter;

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">← 返回管理后台</Link>
              <h1 className="text-2xl font-bold">提现管理</h1>
            </div>
            <p className="text-gray-600">共 {total} 笔提现</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form method="GET" className="flex flex-wrap gap-4">
            <select name="status" defaultValue={statusFilter} className="px-4 py-2 border rounded-lg">
              <option value="">全部状态</option>
              <option value="PENDING">待审核</option>
              <option value="APPROVED">已通过</option>
              <option value="TRANSFERRING">转账中</option>
              <option value="COMPLETED">已完成</option>
              <option value="REJECTED">已拒绝</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">筛选</button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">推广者</th>
                  <th className="px-4 py-3">金额 (USDT)</th>
                  <th className="px-4 py-3">钱包地址</th>
                  <th className="px-4 py-3">申请时间</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">快速操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.promoters?.name}</div>
                      <div className="text-xs text-gray-500">{r.promoters?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.amount.toNumber().toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{r.promoters?.walletAddress || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{r.requestedAt.toLocaleDateString("zh-CN")}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : r.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : r.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updateWithdrawal} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <select name="status" defaultValue={r.status} className="px-2 py-1 border rounded text-xs">
                          <option value="PENDING">待审核</option>
                          <option value="APPROVED">通过</option>
                          <option value="TRANSFERRING">转账中</option>
                          <option value="COMPLETED">完成</option>
                          <option value="REJECTED">拒绝</option>
                        </select>
                        <input type="text" name="txHash" placeholder="TXID" defaultValue={r.txHash || ""} className="w-28 px-2 py-1 border rounded text-xs" />
                        <input type="text" name="remark" placeholder="备注" className="w-24 px-2 py-1 border rounded text-xs" />
                        <button type="submit" className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">更新</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`/admin/withdrawals?page=${page}&status=${statusFilter}`}
                className={`px-3 py-1 rounded ${page === currentPage ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
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
