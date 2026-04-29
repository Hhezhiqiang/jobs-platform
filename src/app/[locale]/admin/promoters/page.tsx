import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PromoterStatus } from "@prisma/client";
import { DataTable, AdminBadge, AdminPagination, AdminSearchBar, type Column, type FilterOption } from "@/components/admin";

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

const statusFilterOptions: FilterOption[] = [
  { label: "全部状态", value: "" },
  { label: "待审核", value: "PENDING" },
  { label: "正常", value: "ACTIVE" },
  { label: "已封禁", value: "SUSPENDED" },
];

const statusBadgeMap: Record<PromoterStatus, { label: string; variant: "success" | "warning" | "error" }> = {
  ACTIVE: { label: "正常", variant: "success" },
  PENDING: { label: "待审核", variant: "warning" },
  SUSPENDED: { label: "已封禁", variant: "error" },
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

  const columns: Column<typeof promoters[number]>[] = [
    {
      key: "name",
      label: "姓名/邮箱",
      render: (_val, row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "状态",
      render: (_val, row) => {
        const s = statusBadgeMap[row.status];
        return <AdminBadge variant={s.variant}>{s.label}</AdminBadge>;
      },
    },
    {
      key: "defaultRate",
      label: "默认比例",
      render: (_val, row) => <span>{row.defaultRate.toFixed(0)}%</span>,
    },
    {
      key: "availableBalance",
      label: "可提现",
      render: (_val, row) => <span>${Number(row.availableBalance).toFixed(2)}</span>,
    },
    {
      key: "totalEarnings",
      label: "累计收益",
      render: (_val, row) => <span>${Number(row.totalEarnings).toFixed(2)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">推广者管理</h1>
        <p className="text-gray-600">共 {total} 位推广者</p>
      </div>

      {/* 搜索筛选 */}
      <AdminSearchBar
        value={query}
        onChange={() => {}}
        filters={statusFilterOptions}
        placeholder="搜索姓名/邮箱"
      />

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={promoters}
        actions={(row) => [
          <form key="update" action={updatePromoterStatus} className="flex items-center gap-2">
            <input type="hidden" name="id" value={row.id} />
            <select
              name="status"
              defaultValue={row.status}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="PENDING">待审核</option>
              <option value="ACTIVE">通过</option>
              <option value="SUSPENDED">封禁</option>
            </select>
            <input
              type="number"
              name="defaultRate"
              defaultValue={row.defaultRate.toNumber()}
              min={1}
              max={98}
              className="w-16 px-2 py-1 border rounded text-xs"
            />
            <button type="submit" className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
              更新
            </button>
          </form>,
        ]}
        emptyState="暂无推广者数据"
      />

      {/* 分页 */}
      {totalPages > 1 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/admin/promoters"
          params={{ status: statusFilter, query }}
        />
      )}
    </div>
  );
}
