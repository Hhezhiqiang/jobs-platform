import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UserDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/login/admin");
  }

  const user = await prisma.users.findUnique({
    where: { id },
    include: {
      user_profiles: true,
      job_applications: {
        include: {
          jobs: {
            include: { companies: true },
          },
        },
        orderBy: { appliedAt: "desc" },
        take: 10,
      },
      resumes: {
        orderBy: { createdAt: "desc" },
      },
      jobs: {
        include: { companies: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      pages: {
        where: { type: "BLOG" },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) {
    notFound();
  }

  const roleMap = {
    ADMIN: { label: "管理员", color: "bg-red-100 text-red-800" },
    USER: { label: "普通用户", color: "bg-blue-100 text-blue-800" },
    COMPANY: { label: "企业用户", color: "bg-green-100 text-green-800" },
  };

  const statusMap = {
    ACTIVE: { label: "正常", color: "bg-green-100 text-green-800" },
    DISABLED: { label: "已禁用", color: "bg-red-100 text-red-800" },
  };

  const applicationStatusMap: Record<string, { label: string; color: string }> = {
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
              <Link href="/admin/users" className="text-blue-600 hover:text-blue-800">
                ← 返回用户列表
              </Link>
              <h1 className="text-2xl font-bold">用户详情</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 左侧：用户信息 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                  {user.name.charAt(0)}
                </div>
              </div>

              <h2 className="text-xl font-bold text-center mb-2">{user.name}</h2>
              <p className="text-gray-500 text-center mb-4">{user.email}</p>

              <div className="flex justify-center gap-2 mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${roleMap[user.role].color}`}
                >
                  {roleMap[user.role].label}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${statusMap[user.status].color}`}
                >
                  {statusMap[user.status].label}
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">手机号</span>
                  <span>{user.phone || "未设置"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">注册时间</span>
                  <span>{user.createdAt.toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最后更新</span>
                  <span>{user.updatedAt.toLocaleDateString("zh-CN")}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-4">账号操作</h3>
                <div className="space-y-2">
                  {user.status === "ACTIVE" ? (
                    <form
                      action={async () => {
                        "use server";
                        await prisma.users.update({
                          where: { id: user.id },
                          data: { status: "DISABLED" },
                        });
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                      >
                        禁用账号
                      </button>
                    </form>
                  ) : (
                    <form
                      action={async () => {
                        "use server";
                        await prisma.users.update({
                          where: { id: user.id },
                          data: { status: "ACTIVE" },
                        });
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        启用账号
                      </button>
                    </form>
                  )}

                  <form
                    action={async () => {
                      "use server";
                      await prisma.users.update({
                        where: { id: user.id },
                        data: {
                          role:
                            user.role === "ADMIN"
                              ? "USER"
                              : user.role === "USER"
                              ? "COMPANY"
                              : "ADMIN",
                        },
                      });
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                    >
                      切换角色
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* 个人资料 */}
            {user.user_profiles && (
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h3 className="font-medium mb-4">个人资料</h3>
                <div className="space-y-3 text-sm">
                  {user.user_profiles.gender && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">性别</span>
                      <span>{user.user_profiles.gender}</span>
                    </div>
                  )}
                  {user.user_profiles.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">所在城市</span>
                      <span>{user.user_profiles.location}</span>
                    </div>
                  )}
                  {user.user_profiles.skills && user.user_profiles.skills.length > 0 && (
                    <div>
                      <span className="text-gray-500">技能标签</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.user_profiles.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.user_profiles.bio && (
                    <div className="mt-4">
                      <span className="text-gray-500">自我介绍</span>
                      <p className="mt-2 text-gray-700">{user.user_profiles.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：详细数据 */}
          <div className="md:col-span-2 space-y-6">
            {/* 统计数据 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm">职位申请</p>
                <p className="text-2xl font-bold">{user.job_applications.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm">发布职位</p>
                <p className="text-2xl font-bold">{user.jobs.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm">博客文章</p>
                <p className="text-2xl font-bold">{user.pages.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm">简历数量</p>
                <p className="text-2xl font-bold">{user.resumes.length}</p>
              </div>
            </div>

            {/* 最近申请 */}
            {user.job_applications.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h3 className="font-medium">最近申请</h3>
                </div>
                <div className="divide-y">
                  {user.job_applications.map((app) => (
                    <div key={app.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{app.jobs.title}</p>
                        <p className="text-sm text-gray-500">{app.jobs.companies.name}</p>
                        <p className="text-xs text-gray-400">
                          申请时间: {app.appliedAt.toLocaleDateString("zh-CN")}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          applicationStatusMap[app.status]?.color ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {applicationStatusMap[app.status]?.label || app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 简历列表 */}
            {user.resumes.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h3 className="font-medium">简历列表</h3>
                </div>
                <div className="divide-y">
                  {user.resumes.map((resume) => (
                    <div key={resume.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{resume.name}</p>
                        <p className="text-sm text-gray-500">
                          {resume.fileType} · {(resume.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {resume.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          默认
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 发布的职位 */}
            {user.jobs.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h3 className="font-medium">发布的职位</h3>
                </div>
                <div className="divide-y">
                  {user.jobs.map((job) => (
                    <div key={job.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.companies.name}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          job.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {job.status === "ACTIVE" ? "招聘中" : "已停止"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
