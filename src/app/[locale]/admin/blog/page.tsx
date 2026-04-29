import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ChevronLeft, ChevronRight, Eye, Edit, ExternalLink } from "lucide-react";

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

  const statusMap: Record<string, { label: string; className: string }> = {
    PUBLISHED: { label: "已发布", className: "bg-green-100 text-green-700" },
    DRAFT: { label: "草稿", className: "bg-yellow-100 text-yellow-700" },
    ARCHIVED: { label: "已归档", className: "bg-gray-100 text-gray-700" },
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">博客管理</h1>
        <Link
          href={`/${locale}/admin/blog/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + 新建文章
        </Link>
      </div>

      {/* 统计 */}
      <p className="text-sm text-gray-600">共 {totalCount} 篇文章</p>

      {/* 数据表格 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">文章</th>
                <th className="px-4 py-3 text-left font-medium">作者</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">浏览量</th>
                <th className="px-4 py-3 text-left font-medium">发布时间</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    暂无博客文章
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const status = statusMap[post.status] || statusMap.ARCHIVED;
                  return (
                    <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500">/blog/{post.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{post.users?.name || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{post.viewCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {post.createdAt.toLocaleDateString("zh-CN")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/${locale}/blog/${encodeURIComponent(post.slug)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-blue-600"
                            title="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/${locale}/admin/blog/edit/${post.id}`}
                            className="p-1.5 text-gray-600 hover:text-indigo-600"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              第 {currentPage} 页，共 {totalPages} 页
            </p>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/${locale}/admin/blog?page=${currentPage - 1}`}
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
                    href={`/${locale}/admin/blog?page=${page}`}
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
                  href={`/${locale}/admin/blog?page=${currentPage + 1}`}
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
