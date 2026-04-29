import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DataTable, AdminBadge, AdminPagination, type Column } from "@/components/admin";

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

  const statusBadge = (status: string) => {
    if (status === "PUBLISHED") return <AdminBadge variant="success">已发布</AdminBadge>;
    if (status === "DRAFT") return <AdminBadge variant="warning">草稿</AdminBadge>;
    return <AdminBadge>已归档</AdminBadge>;
  };

  const columns: Column<typeof posts[number]>[] = [
    {
      key: "title",
      label: "文章",
      render: (_val, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.title}</div>
          <div className="text-sm text-gray-500">/blog/{row.slug}</div>
        </div>
      ),
    },
    {
      key: "author",
      label: "作者",
      render: (_val, row) => (
        <span className="text-sm text-gray-900">{row.users?.name || "-"}</span>
      ),
    },
    {
      key: "status",
      label: "状态",
      render: (_val, row) => statusBadge(row.status),
    },
    {
      key: "viewCount",
      label: "浏览量",
      render: (_val, row) => <span className="text-sm text-gray-900">{row.viewCount}</span>,
    },
    {
      key: "createdAt",
      label: "发布时间",
      render: (_val, row) => (
        <span className="text-sm text-gray-500">{row.createdAt.toLocaleDateString("zh-CN")}</span>
      ),
    },
  ];

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

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={posts}
        actions={(row) => [
          <Link
            key="preview"
            href={`/${locale}/blog/${encodeURIComponent(row.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            预览
          </Link>,
          <Link
            key="edit"
            href={`/${locale}/admin/blog/edit/${row.id}`}
            className="text-indigo-600 hover:text-indigo-900 text-sm"
          >
            编辑
          </Link>,
        ]}
        emptyState="暂无博客文章"
      />

      {/* 分页 */}
      {totalPages > 1 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl={`/${locale}/admin/blog`}
        />
      )}
    </div>
  );
}
