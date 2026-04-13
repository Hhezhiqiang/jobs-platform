import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

async function toggleUserStatus(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("未登录");
  }
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") {
    throw new Error("无权操作");
  }

  const userId = formData.get("userId") as string;
  const status = formData.get("status") as UserStatus;
  if (!userId || !status) throw new Error("参数不完整");

  await prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/login/admin");
  }

  // 获取所有用户
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      _count: {
        select: {
          applications: true,
          jobs: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const roleMap: Record<UserRole, { label: string; color: string }> = {
    ADMIN: { label: "管理员", color: "bg-red-100 text-red-800" },
    USER: { label: "用户", color: "bg-blue-100 text-blue-800" },
    COMPANY: { label: "企业", color: "bg-green-100 text-green-800" },
  };

  const statusMap: Record<UserStatus, { label: string; color: string }> = {
    ACTIVE: { label: "正常", color: "bg-green-100 text-green-800" },
    DISABLED: { label: "禁用", color: "bg-red-100 text-red-800" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← 返回管理后台
              </Link>
              <h1 className="text-2xl font-bold">用户管理</h1>
            </div>
            <p className="text-gray-600">共 {users.length} 位用户</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">总用户数</p>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">普通用户</p>
            <p className="text-3xl font-bold text-blue-600">
              {users.filter((u) => u.role === "USER").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">企业用户</p>
            <p className="text-3xl font-bold text-green-600">
              {users.filter((u) => u.role === "COMPANY").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">管理员</p>
            <p className="text-3xl font-bold text-red-600">
              {users.filter((u) => u.role === "ADMIN").length}
            </p>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">用户列表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    统计
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-gray-400">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          roleMap[user.role].color
                        }`}
                      >
                        {roleMap[user.role].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusMap[user.status].color
                        }`}
                      >
                        {statusMap[user.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>申请: {user._count.applications}</div>
                      <div>发布: {user._count.jobs}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.createdAt.toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        查看
                      </Link>
                      {user.status === "ACTIVE" ? (
                        <form
                          action={toggleUserStatus}
                          className="inline"
                        >
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value="DISABLED" />
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-900"
                          >
                            禁用
                          </button>
                        </form>
                      ) : (
                        <form
                          action={toggleUserStatus}
                          className="inline"
                        >
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value="ACTIVE" />
                          <button
                            type="submit"
                            className="text-green-600 hover:text-green-900"
                          >
                            启用
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>暂无用户数据</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
