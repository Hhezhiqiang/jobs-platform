import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // 获取统计数据
  const [jobCount, companyCount, blogCount, totalViews] = await Promise.all([
    prisma.job.count(),
    prisma.company.count(),
    prisma.page.count({ where: { type: "BLOG" } }),
    prisma.page.aggregate({
      where: { type: "BLOG" },
      _sum: { viewCount: true },
    }),
  ]);

  // 获取最近发布的职位和博客
  const [recentJobs, recentBlogs] = await Promise.all([
    prisma.job.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.page.findMany({
      where: { type: "BLOG" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: true },
    }),
  ]);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">总职位数</p>
            <p className="text-3xl font-bold">{jobCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">公司数</p>
            <p className="text-3xl font-bold">{companyCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">博客文章</p>
            <p className="text-3xl font-bold">{blogCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">博客总浏览</p>
            <p className="text-3xl font-bold">{totalViews._sum.viewCount || 0}</p>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">快捷操作</h2>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/admin/jobs/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              + 发布新职位
            </Link>
            <Link
              href="/admin/blog/new"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              + 写文章
            </Link>
            <Link
              href="/admin/blog"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              管理博客
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

        {/* 最近博客文章 */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">最近发布的博客</h2>
            <Link href="/admin/blog" className="text-blue-600 hover:text-blue-800 text-sm">
              查看全部 →
            </Link>
          </div>
          <div className="divide-y">
            {recentBlogs.map((blog) => (
              <div key={blog.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{blog.title}</p>
                  <p className="text-sm text-gray-600">
                    {blog.author.name} · {blog.viewCount} 次浏览
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      blog.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : blog.status === "DRAFT"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {blog.status === "PUBLISHED"
                      ? "已发布"
                      : blog.status === "DRAFT"
                      ? "草稿"
                      : "已归档"}
                  </span>
                  <Link
                    href={`/admin/blog/edit/${blog.id}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    编辑
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
