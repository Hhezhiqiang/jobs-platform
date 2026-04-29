import type { Prisma } from "@prisma/client";
import { WithdrawalStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DataTable, AdminBadge, AdminPagination, AdminSearchBar, type Column, type FilterOption } from "@/components/admin";

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
}

const statusFilterOptions: FilterOption[] = [
  { label: "全部状态", value: "" },
  { label: "待审核", value: "PENDING" },
  { label: "已通过", value: "APPROVED" },
  { label: "转账中", value: "TRANSFERRING" },
  { label: "已完成", value: "COMPLETED" },
  { label: "已拒绝", value: "REJECTED" },
];

const statusBadgeMap: Record<WithdrawalStatus, { label: string; variant: "success" | "warning" | "error" | "info" }> = {
  COMPLETED: { label: "已完成", variant: "success" },
  REJECTED: { label: "已拒绝", variant: "error" },
  PENDING: { label: "待审核", variant: "warning" },
  APPROVED: { label: "已通过", variant: "info" },
  TRANSFERRING: { label: "转账中", variant: "info" },
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

  const columns: Column<typeof records[number]>[] = [
    {
      key: "promoter",
      label: "推广者",
      render: (_val, row) => (
        <div>
          <div className="font-medium">{row.promoters?.name}</div>
          <div className="text-xs text-gray-500">{row.promoters?.email}</div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "金额 (USDT)",
      render: (_val, row) => <span className="font-semibold">{row.amount.toNumber().toFixed(2)}</span>,
    },
    {
      key: "walletAddress",
      label: "钱包地址",
      render: (_val, row) => (
        <span className="text-xs text-gray-500 font-mono">
          {row.promoters?.walletAddress || "-"}
        </span>
      ),
    },
    {
      key: "requestedAt",
      label: "申请时间",
      render: (_val, row) => (
        <span className="text-gray-500">{row.requestedAt.toLocaleDateString("zh-CN")}</span>
      ),
    },
    {
      key: "status",
      label: "状态",
      render: (_val, row) => {
        const s = statusBadgeMap[row.status];
        if (!s) return <AdminBadge>{row.status}</AdminBadge>;
        return <AdminBadge variant={s.variant}>{s.label}</AdminBadge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">提现管理</h1>
        <p className="text-gray-600">共 {total} 笔提现</p>
      </div>

      {/* 搜索筛选 */}
      <AdminSearchBar
        value=""
        onChange={() => {}}
        filters={statusFilterOptions}
        placeholder="筛选状态"
      />

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={records}
        actions={(row) => [
          <form key="update" action={updateWithdrawal} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={row.id} />
            <select
              name="status"
              defaultValue={row.status}
              className="px-2 py-1 border rounded text-xs"
            >
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
          </form>,
        ]}
        emptyState="暂无提现记录"
      />

      {/* 分页 */}
      {totalPages > 1 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/admin/withdrawals"
          params={{ status: statusFilter }}
        />
      )}
    </div>
  );
}
