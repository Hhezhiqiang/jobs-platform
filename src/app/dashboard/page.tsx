import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // 获取用户信息和统计
  const [user, applicationCount, resumeCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    }),
    prisma.jobApplication.count({
      where: { userId: session.user.id },
    }),
    prisma.resume.count({
      where: { userId: session.user.id },
    }),
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  // 获取最近的申请
  const recentApplications = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { appliedAt: "desc" },
    take: 3,
    include: {
      job: {
        include: { company: true },
      },
    },
  });

  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: "待处理", color: "bg-yellow-100 text-yellow-800" },
    VIEWED: { label: "已查看", color: "bg-blue-100 text-blue-800" },
    INTERVIEW: { label: "面试邀请", color: "bg-green-100 text-green-800" },
    REJECTED: { label: "已拒绝", color: "bg-red-100 text-red-800" },
    OFFER: { label: "已录用", color: "bg-purple-100 text-purple-800" },
    WITHDRAWN: { label: "已撤回", color: "bg-gray-100 text-gray-800" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← 返回首页
              </Link>
              <h1 className="text-2xl font-bold">个人中心</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">欢迎，{user.name}</span>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  退出登录
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 侧边导航 */}
          <div className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4 space-y-2">
              <Link
                href="/dashboard"
                className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
              >
                📊 概览
              </Link>
              <Link
                href="/dashboard/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                📄 我的简历
              </Link>
              <Link
                href="/dashboard/applications"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                📋 我的申请
              </Link>
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                ⚙️ 账号设置
              </Link>
            </nav>
          </div>

          {/* 主内容区 */}
          <div className="md:col-span-3 space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">我的申请</p>
                <p className="text-3xl font-bold text-blue-600">{applicationCount}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">简历数量</p>
                <p className="text-3xl font-bold text-green-600">{resumeCount}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">面试邀请</p>
                <p className="text-3xl font-bold text-purple-600">
                  {recentApplications.filter((a) => a.status === "INTERVIEW").length}
                </p>
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4">快捷操作</h2>
              <div className="flex gap-4 flex-wrap">
                <Link
                  href="/jobs"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔍 浏览职位
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  📝 完善简历
                </Link>
                <Link
                  href="/dashboard/applications"
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  📋 查看申请
                </Link>
              </div>
            </div>

            {/* 最近申请 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold">最近申请</h2>
                <Link
                  href="/dashboard/applications"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  查看全部 →
                </Link>
              </div>
              <div className="divide-y">
                {recentApplications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>暂无申请记录</p>
                    <Link
                      href="/jobs"
                      className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                    >
                      去浏览职位 →
                    </Link>
                  </div>
                ) : (
                  recentApplications.map((app) => (
                    <div key={app.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{app.job.title}</p>
                        <p className="text-sm text-gray-600">{app.job.company.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          申请时间：{app.appliedAt.toLocaleDateString("zh-CN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            statusMap[app.status]?.color || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {statusMap[app.status]?.label || app.status}
                        </span>
                        {app.status === "PENDING" && (
                          <form
                            action={async () => {
                              "use server";
                              await prisma.jobApplication.update({
                                where: { id: app.id },
                                data: { status: "WITHDRAWN", withdrewAt: new Date() },
                              });
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs text-gray-500 hover:text-red-600"
                            >
                              撤回
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
