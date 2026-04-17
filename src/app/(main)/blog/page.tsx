import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { CalendarDays, Eye, TrendingUp, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HotBlogsSidebar } from "@/components/hot-blogs-sidebar";
import { BlogStructuredData } from "@/components/blog-structured-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

// 缓存获取博客数据
const getBlogPosts = cache(async (searchQuery?: string, page = 1) => {
  const pageSize = 9;
  const skip = (page - 1) * pageSize;

  const where = {
    type: "BLOG" as const,
    status: "PUBLISHED" as const,
    ...(searchQuery
      ? {
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" as const } },
            { content: { contains: searchQuery, mode: "insensitive" as const } },
            { keywords: { hasSome: [searchQuery] } },
          ],
        }
      : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.pages.findMany({
      where,
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        viewCount: true,
        createdAt: true,
        keywords: true,
      },
    }),
    prisma.pages.count({ where }),
  ]);

  return { posts, total, pageCount: Math.ceil(total / pageSize) };
});

export const metadata: Metadata = {
  title: "求职博客 | 薪资报告、面试攻略、职业规划 - JobQuip",
  description: "专业的互联网求职博客，提供2026最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。涵盖前端、后端、产品、运营等热门岗位，助你快速拿到理想Offer。",
  keywords: ["求职博客", "薪资报告", "面试攻略", "简历优化", "职业规划", "大厂面经", "互联网求职", "2026求职趋势"],
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "求职博客 | 薪资报告、面试攻略、职业规划",
    description: "专业的互联网求职博客，提供2026最新薪资报告、大厂面试攻略、简历优化技巧。",
    type: "website",
    url: `${SITE_URL}/blog`,
  },
};

interface BlogPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const searchQuery = params.q || "";
  const page = parseInt(params.page || "1", 10);

  const { posts, total, pageCount } = await getBlogPosts(searchQuery, page);

  if (posts.length === 0 && searchQuery) {
    notFound();
  }

  return (
    <>
      <BlogStructuredData posts={posts} total={total} />
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              求职博客
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {searchQuery
                ? `"${searchQuery}" 的搜索结果 (${total}篇)`
                : "专业的互联网求职指南，助你拿到理想Offer"}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* 主内容区 */}
            <div className="flex-1">
              {/* 博客卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, index) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="block">
                      {/* 封面图 */}
                      <div className="relative h-48 overflow-hidden">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority={index < 3}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">JobQuip</span>
                          </div>
                        )}
                        
                        {/* 热门标签 */}
                        {post.viewCount >= 50 && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            热门
                          </div>
                        )}
                      </div>

                      {/* 内容 */}
                      <div className="p-5">
                        <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h2>

                        {post.excerpt && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                            {post.excerpt}
                          </p>
                        )}

                        {/* 标签 */}
                        {post.keywords && post.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {post.keywords.slice(0, 3).map((keyword) => (
                              <span
                                key={keyword}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 元信息 */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {post.viewCount}
                            </span>
                          </div>
                          <span className="text-blue-600 font-medium group-hover:underline flex items-center gap-0.5">
                            阅读
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {/* 分页 */}
              {pageCount > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  {page > 1 && (
                    <Link
                      href={`/blog?page=${page - 1}${searchQuery ? `&q=${searchQuery}` : ""}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      上一页
                    </Link>
                  )}
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    {page} / {pageCount}
                  </span>
                  {page < pageCount && (
                    <Link
                      href={`/blog?page=${page + 1}${searchQuery ? `&q=${searchQuery}` : ""}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      下一页
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* 侧边栏 */}
            <aside className="lg:w-80 space-y-6">
              <HotBlogsSidebar />
              
              {/* 搜索框 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-bold text-gray-900 mb-4">搜索文章</h3>
                <form action="/blog" method="GET" className="flex gap-2">
                  <input
                    type="text"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="输入关键词..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    搜索
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

// ISR - 每10分钟重新验证
export const revalidate = 600;
