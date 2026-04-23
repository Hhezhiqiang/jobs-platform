import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ITEMS_PER_PAGE = 15;

export const dynamic = "force-dynamic";
export default async function AdminBlogPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || "1"));
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/auth/login/admin`);
  }

  const [posts, totalCount] = await Promise.all([
    prisma.pages.findMany({
      where: { type: "BLOG" },
      orderBy: { createdAt: "desc" },
      include: { users: true },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.pages.count({ where: { type: "BLOG" } }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/admin`} className="text-blue-600 hover:text-blue-800">
                ← 返回控制台
              </Link>
              <h1 className="text-2xl font-bold">博客管理</h1>
            </div>
            <Link
              href={`/${locale}/admin/blog/new`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 新建文章
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文章</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作者</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浏览量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{post.title}</div>
                    <div className="text-sm text-gray-500">/blog/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-gray-900">{post.users?.name || "-"}</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      post.status === "PUBLISHED" ? "bg-green-100 text-green-800"
                        : post.status === "DRAFT" ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {post.status === "PUBLISHED" ? "已发布" : post.status === "DRAFT" ? "草稿" : "已归档"}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-gray-900">{post.viewCount}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-gray-500">{post.createdAt.toLocaleDateString("zh-CN")}</span></td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/blog/${encodeURIComponent(post.slug)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">预览</Link>
                      <Link href={`/${locale}/admin/blog/edit/${post.id}`} className="text-indigo-600 hover:text-indigo-900">编辑</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无博客文章</p>
              <Link href={`/${locale}/admin/blog/new`} className="text-blue-600 hover:text-blue-800 mt-2 inline-block">创建第一篇</Link>
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">第 {currentPage} 页，共 {totalPages} 页 ({totalCount} 篇)</p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link href={`/${locale}/admin/blog?page=${currentPage - 1}`} className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"><ChevronLeft className="w-4 h-4"/>上一页</Link>
                )}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <Link key={page} href={`/${locale}/admin/blog?page=${page}`} className={`px-3 py-2 text-sm rounded-lg ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{page}</Link>
                  );
                })}
                {currentPage < totalPages && (
                  <Link href={`/${locale}/admin/blog?page=${currentPage + 1}`} className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">下一页<ChevronRight className="w-4 h-4"/></Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
