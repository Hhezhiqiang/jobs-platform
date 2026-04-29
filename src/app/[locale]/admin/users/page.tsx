import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, User, Building2, Shield } from "lucide-react";
import { DataTable, AdminBadge, AdminPagination, StatCard, type Column } from "@/components/admin";
import { UserRole, UserStatus } from "@prisma/client";

async function toggleUserStatus(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("未登录");
  }
  const currentUser = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") {
    throw new Error("无权操作");
  }

  const userId = formData.get("userId") as string;
  const status = formData.get("status") as UserStatus;
  if (!userId || !status) throw new Error("参数不完整");

  await prisma.users.update({
    where: { id: userId },
    data: { status },
  });
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export const dynamic = "force-dynamic";
export default async function UsersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || "1"));
  const ITEMS_PER_PAGE = 20;

  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/auth/login/admin`);
  }

  const [users, totalCount] = await Promise.all([
    prisma.users.findMany({
      include: {
        user_profiles: true,
        _count: {
          select: {
            job_applications: true,
            jobs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.users.count(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const userCount = users.filter((u) => u.role === "USER").length;
  const companyCount = users.filter((u) => u.role === "COMPANY").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  const roleBadge = (role: UserRole) => {
    if (role === "ADMIN") return <AdminBadge variant="error">管理员</AdminBadge>;
    if (role === "COMPANY") return <AdminBadge variant="success">企业</AdminBadge>;
    return <AdminBadge variant="info">用户</AdminBadge>;
  };

  const statusBadge = (status: UserStatus) => {
    if (status === "ACTIVE") return <AdminBadge variant="success">正常</AdminBadge>;
    return <AdminBadge variant="error">禁用</AdminBadge>;
  };

  const columns: Column<typeof users[number]>[] = [
    {
      key: "name",
      label: "用户信息",
      render: (_val, row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
            {row.name.charAt(0)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
            {row.phone && <div className="text-xs text-gray-400">{row.phone}</div>}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "角色",
      render: (_val, row) => roleBadge(row.role),
    },
    {
      key: "status",
      label: "状态",
      render: (_val, row) => statusBadge(row.status),
    },
    {
      key: "stats",
      label: "统计",
      render: (_val, row) => (
        <div className="text-sm text-gray-500">
          <div>申请: {row._count.job_applications}</div>
          <div>发布: {row._count.jobs}</div>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "注册时间",
      render: (_val, row) => (
        <span className="text-sm text-gray-500">
          {row.createdAt.toLocaleDateString("zh-CN")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600">共 {totalCount} 位用户</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="总用户数" value={users.length} icon={Users} color="blue" />
        <StatCard title="普通用户" value={userCount} icon={User} color="blue" />
        <StatCard title="企业用户" value={companyCount} icon={Building2} color="green" />
        <StatCard title="管理员" value={adminCount} icon={Shield} color="orange" />
      </div>

      {/* 用户列表 */}
      <DataTable
        columns={columns}
        data={users}
        actions={(row) => [
          <Link
            key="view"
            href={`/admin/users/${row.id}`}
            className="text-indigo-600 hover:text-indigo-900 text-sm"
          >
            查看
          </Link>,
          row.status === "ACTIVE" ? (
            <form key="toggle" action={toggleUserStatus} className="inline">
              <input type="hidden" name="userId" value={row.id} />
              <input type="hidden" name="status" value="DISABLED" />
              <button type="submit" className="text-red-600 hover:text-red-900 text-sm">
                禁用
              </button>
            </form>
          ) : (
            <form key="toggle" action={toggleUserStatus} className="inline">
              <input type="hidden" name="userId" value={row.id} />
              <input type="hidden" name="status" value="ACTIVE" />
              <button type="submit" className="text-green-600 hover:text-green-900 text-sm">
                启用
              </button>
            </form>
          ),
        ]}
        emptyState="暂无用户数据"
      />

      {/* 分页 */}
      {totalPages > 1 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/admin/users"
        />
      )}
    </div>
  );
}
