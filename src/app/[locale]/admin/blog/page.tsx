import Link from "next/link";
import { Rocket, 
   prisma } from "@/lib/prisma";
import { Rocket, 
   redirect } from "next/navigation";
import { Rocket, 
   getServerSession } from "next-auth/next";
import { Rocket, 
   authOptions } from "@/lib/auth";
import { Rocket, 
   ChevronLeft, ChevronRight, Eye, Edit, Search, Trash2, Filter, Archive } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

const ITEMS_PER_PAGE = 15;

export const dynamic = "force-dynamic";

async function publishAllDrafts() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return;
  await prisma.pages.updateMany({
    where: { type: "BLOG", status: "DRAFT" },
    data: { status: "PUBLISHED" },
  });
}
export default async function AdminBlogPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || "1"));
  const filterStatus = sp.status || "";
  const searchQuery = sp.search || "";

  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/auth/login/admin`);
  }

  // 构建查询条件
  const where: any = { type: "BLOG" };
  if (filterStatus && filterStatus !== "ALL") {
    where.status = filterStatus;
  }
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { slug: { contains: searchQuery, mode: "insensitive" } },
      { excerpt: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const [posts, totalCount, statusCounts] = await Promise.all([
    prisma.pages.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { users: { select: { name: true } } },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.pages.count({ where }),
    prisma.pages.groupBy({
      by: ["status"],
      where: { type: "BLOG" },
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // 统计各状态数量
  const counts: Record<string, number> = { ALL: 0 };
  for (const s of statusCounts) {
    counts[s.status] = s._count;
    counts.ALL += s._count;
  }

  const statusTabs = [
    { key: "", label: `全部 (${counts.ALL || 0})`, color: "bg-gray-100 text-gray-700" },
    { key: "PUBLISHED", label: `已发布 (${counts.PUBLISHED || 0})`, color: "bg-green-100 text-green-700" },
    { key: "DRAFT", label: `草稿 (${counts.DRAFT || 0})`, color: "bg-yellow-100 text-yellow-700" },
    { key: "ARCHIVED", label: `已归档 (${counts.ARCHIVED || 0})`, color: "bg-gray-100 text-gray-500" },
  ];

  const statusMap: Record<string, { label: string; className: string }> = {
    PUBLISHED: { label: "已发布", className: "bg-green-100 text-green-700" },
    DRAFT: { label: "草稿", className: "bg-yellow-100 text-yellow-700" },
    ARCHIVED: { label: "已归档", className: "bg-gray-100 text-gray-500" },
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">博客管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {totalCount} 篇博客</p>
        </div>
        <Link
          href={`/${locale}/admin/blog/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">\n          <span className="text-lg">+</span> 新建博客\n        </Link>\n        <form action={publishAllDrafts}>\n          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2">\n            <Rocket className="w-4 h-4" />\n            一键发布全部草稿\n          </button>\n        </form>
        >
          <span className="text-lg">+</span> 新建博客
        </Link>
      </div>

      {/* 搜索 & 筛选 */}
      <div className="flex items-center gap-3 flex-wrap">
        <form className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="搜索博客标题或描述..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            搜索
          </button>
          {searchQuery && (
            <Link
              href={`/${locale}/admin/blog${filterStatus ? `?status=${filterStatus}` : ""}`}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              清除
            </Link>
          )}
        </form>

        <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
          <Filter className="w-4 h-4 text-gray-400 ml-2" />
          {statusTabs.map((tab) => {
            const isActive = (filterStatus || "") === tab.key;
            const href = `/${locale}/admin/blog${tab.key ? `?status=${tab.key}` : ""}${searchQuery ? `${tab.key ? "&" : "?"}search=${searchQuery}` : ""}`;
            return (
              <Link
                key={tab.key}
                href={href}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-8">#</th>
                <th className="px-4 py-3 text-left font-medium">标题</th>
                <th className="px-4 py-3 text-left font-medium w-24">作者</th>
                <th className="px-4 py-3 text-left font-medium w-20">状态</th>
                <th className="px-4 py-3 text-left font-medium w-20">浏览量</th>
                <th className="px-4 py-3 text-left font-medium w-28">创建时间</th>
                <th className="px-4 py-3 text-right font-medium w-28">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Archive className="w-10 h-10 text-gray-300" />
                      <p className="text-gray-400">暂无博客文章</p>
                      {searchQuery && (
                        <p className="text-sm text-gray-400">未找到匹配 "{searchQuery}" 的结果</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post, index) => {
                  const status = statusMap[post.status] || statusMap.ARCHIVED;
                  return (
                    <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0">
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/${locale}/blog/${encodeURIComponent(post.slug)}`}
                          target="_blank"
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        <div className="text-xs text-gray-400 mt-0.5">/blog/{post.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{post.users?.name || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{post.viewCount.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {post.createdAt.toLocaleDateString("zh-CN")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/${locale}/blog/${encodeURIComponent(post.slug)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/${locale}/admin/blog/edit/${post.id}`}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
              第 {currentPage} 页，共 {totalPages} 页，{totalCount} 条记录
            </p>
            <div className="flex gap-1">
              {currentPage > 1 && (
                <Link
                  href={`/${locale}/admin/blog?page=${currentPage - 1}${filterStatus ? `&status=${filterStatus}` : ""}${searchQuery ? `&search=${searchQuery}` : ""}`}
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
                const href = `/${locale}/admin/blog?page=${page}${filterStatus ? `&status=${filterStatus}` : ""}${searchQuery ? `&search=${searchQuery}` : ""}`;
                return (
                  <Link
                    key={page}
                    href={href}
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
                  href={`/${locale}/admin/blog?page=${currentPage + 1}${filterStatus ? `&status=${filterStatus}` : ""}${searchQuery ? `&search=${searchQuery}` : ""}`}
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