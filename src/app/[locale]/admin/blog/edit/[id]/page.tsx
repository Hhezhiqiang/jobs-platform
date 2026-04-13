import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PageStatus } from "@prisma/client";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  const post = await prisma.page.findUnique({
    where: { id, type: "BLOG" },
  });

  if (!post) {
    notFound();
  }

  async function updateBlog(formData: FormData) {
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

    const postId = formData.get("id") as string;
    if (!postId) throw new Error("缺少文章ID");

    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const featuredImage = formData.get("featuredImage") as string;
    const keywords = (formData.get("keywords") as string)
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const status = formData.get("status") as PageStatus;

    await prisma.page.update({
      where: { id: postId },
      data: {
        title,
        slug,
        excerpt,
        content,
        status,
        featuredImage: featuredImage || null,
        keywords,
      },
    });

    redirect("/admin/blog");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/blog" className="text-blue-600 hover:text-blue-800">
              ← 返回博客列表
            </Link>
            <h1 className="text-2xl font-bold">编辑文章</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form action={updateBlog} className="bg-white rounded-lg shadow-md p-8">
          <input type="hidden" name="id" value={post.id} />
          <div className="space-y-6">
            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 *
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={post.title}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL 标识 (Slug) *
              </label>
              <input
                type="text"
                name="slug"
                required
                defaultValue={post.slug}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 摘要 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                摘要
              </label>
              <textarea
                name="excerpt"
                rows={3}
                defaultValue={post.excerpt || ""}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            {/* 封面图 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                封面图 URL
              </label>
              <input
                type="url"
                name="featuredImage"
                defaultValue={post.featuredImage || ""}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 关键词 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关键词（逗号分隔）
              </label>
              <input
                type="text"
                name="keywords"
                defaultValue={post.keywords.join(", ")}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发布状态
              </label>
              <select
                name="status"
                defaultValue={post.status}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">已发布</option>
                <option value="ARCHIVED">归档</option>
              </select>
            </div>

            {/* 内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                内容 (Markdown) *
              </label>
              <textarea
                name="content"
                rows={20}
                required
                defaultValue={post.content}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              ></textarea>
            </div>

            {/* 统计信息 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                浏览量: {post.viewCount} | 创建时间: {post.createdAt.toLocaleDateString("zh-CN")} | 更新时间: {post.updatedAt.toLocaleDateString("zh-CN")}
              </p>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                更新文章
              </button>
              <Link
                href="/admin/blog"
                className="px-6 py-3 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
