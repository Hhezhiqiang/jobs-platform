import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PageType, PageStatus } from "@prisma/client";
import Link from "next/link";

export default async function NewBlogPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login/admin");
  }

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
  });

  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  async function createBlog(formData: FormData) {
    "use server";

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

    await prisma.pages.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        type: PageType.BLOG,
        status,
        featuredImage: featuredImage || null,
        keywords,
        authorId: session!.user!.id,
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
            <h1 className="text-2xl font-bold">新建文章</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form action={createBlog} className="bg-white rounded-lg shadow-md p-8">
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：2026年北京互联网行业薪资报告"
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：2026-beijing-salary-report"
              />
              <p className="text-sm text-gray-500 mt-1">
                将显示为 /blog/your-slug
              </p>
            </div>

            {/* 摘要 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                摘要
              </label>
              <textarea
                name="excerpt"
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="简短描述文章内容，用于SEO和列表展示..."
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://images.unsplash.com/..."
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2026薪资报告, 北京互联网, 前端工程师"
              />
            </div>

            {/* 状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发布状态
              </label>
              <select
                name="status"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">立即发布</option>
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder={`# 文章标题

## 引言

正文内容...

## FAQ

**Q: 问题1？**
A: 答案1...

**Q: 问题2？**
A: 答案2...`}
              ></textarea>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                保存文章
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
