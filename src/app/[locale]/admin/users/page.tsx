import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, User, Building2, Shield, ChevronLeft, ChevronRight, UserCheck, UserX } from "lucide-react";
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
    const map: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-700",
      COMPANY: "bg-green-100 text-green-700",
      USER: "bg-blue-100 text-blue-700",
    };
    const labelMap: Record<string, string> = {
      ADMIN: "管理员",
      COMPANY: "企业",
      USER: "用户",
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[role] || "bg-gray-100 text-gray-700"}`}>{labelMap[role] || role}</span>;
  };

  const statusBadge = (status: UserStatus) => {
    const map: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-700",
      DISABLED: "bg-gray-100 text-gray-700",
    };
    const labelMap: Record<string, string> = {
      ACTIVE: "正常",
      DISABLED: "禁用",
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[status] || "bg-gray-100 text-gray-700"}`}>{labelMap[status] || status}</span>;
  };

  const stats: { title: string; value: number; icon: React.ReactNode; color: string }[] = [
    { title: "总用户数", value: totalCount, icon: <Users className="w-6 h-6" />, color: "bg-blue-500" },
    { title: "普通用户", value: userCount, icon: <User className="w-6 h-6" />, color: "bg-blue-500" },
    { title: "企业用户", value: companyCount, icon: <Building2 className="w-6 h-6" />, color: "bg-green-500" },
    { title: "管理员", value: adminCount, icon: <Shield className="w-6 h-6" />, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600">共 {totalCount} 位用户</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">用户信息</th>
                <th className="px-4 py-3 text-left font-medium">角色</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">统计</th>
                <th className="px-4 py-3 text-left font-medium">注册时间</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3">{roleBadge(row.role)}</td>
                    <td className="px-4 py-3">{statusBadge(row.status)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500">
                        <div>申请: {row._count.job_applications}</div>
                        <div>发布: {row._count.jobs}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {row.createdAt.toLocaleDateString("zh-CN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/${locale}/admin/users/${row.id}`}
                          className="p-1.5 text-gray-600 hover:text-indigo-600"
                          title="查看"
                        >
                          <Shield className="w-4 h-4" />
                        </Link>
                        {row.status === "ACTIVE" ? (
                          <form action={toggleUserStatus} className="inline">
                            <input type="hidden" name="userId" value={row.id} />
                            <input type="hidden" name="status" value="DISABLED" />
                            <button type="submit" className="p-1.5 text-gray-600 hover:text-red-600" title="禁用">
                              <UserX className="w-4 h-4" />
                            </button>
                          </form>
                        ) : (
                          <form action={toggleUserStatus} className="inline">
                            <input type="hidden" name="userId" value={row.id} />
                            <input type="hidden" name="status" value="ACTIVE" />
                            <button type="submit" className="p-1.5 text-gray-600 hover:text-green-600" title="启用">
                              <UserCheck className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
                  href={`/${locale}/admin/users?page=${currentPage - 1}`}
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
                    href={`/${locale}/admin/users?page=${page}`}
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
                  href={`/${locale}/admin/users?page=${currentPage + 1}`}
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
