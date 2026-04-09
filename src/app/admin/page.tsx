import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // 静态数据（快速部署模式）
  const stats = {
    jobCount: 2,
    companyCount: 2,
  };

  const recentJobs = [
    { id: "1", title: "高级前端工程师", company: { name: "科技有限公司" }, status: "ACTIVE" },
    { id: "2", title: "后端开发工程师", company: { name: "创新科技" }, status: "ACTIVE" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← 返回网站
              </Link>
              <h1 className="text-2xl font-bold">管理后台</h1>
            </div>
            <p className="text-gray-600">欢迎, {session.user?.name || "管理员"}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">总职位数</p>
            <p className="text-3xl font-bold">{stats.jobCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">公司数</p>
            <p className="text-3xl font-bold">{stats.companyCount}</p>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">快捷操作</h2>
          <div className="flex gap-4">
            <Link
              href="/admin/jobs/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              + 发布新职位
            </Link>
            <Link
              href="/admin/ads"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              管理广告
            </Link>
          </div>
        </div>

        {/* 最近职位 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">最近发布的职位</h2>
          </div>
          <div className="divide-y">
            {recentJobs.map((job) => (
              <div key={job.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-sm text-gray-600">{job.company.name}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    job.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
