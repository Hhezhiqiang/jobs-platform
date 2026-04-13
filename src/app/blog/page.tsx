import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Metadata } from "next";
import { BookOpen, Users, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "求职博客 - 薪资报告、面试攻略、行业趋势 | 招聘平台",
  description: "互联网求职干货：2026薪资报告、产品经理面试攻略、东京IT求职指南、简历优化技巧。专家级内容助你快速拿到理想Offer。",
  keywords: ["求职博客", "薪资报告", "面试攻略", "产品经理", "东京IT求职"],
  openGraph: {
    images: ["https://jobs-platform-gold.vercel.app/logo.png"],
  },
  twitter: {
    images: ["https://jobs-platform-gold.vercel.app/logo.png"],
  },
};

export const revalidate = 3600;

const categories = [
  { name: "全部", icon: "📚" },
  { name: "面试攻略", icon: "🎯" },
  { name: "简历优化", icon: "📝" },
  { name: "薪资谈判", icon: "💰" },
  { name: "职业发展", icon: "🚀" },
  { name: "行业趋势", icon: "📊" },
  { name: "职场技能", icon: "💡" },
];

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.q || "";
  const selectedCategory = params.category || "全部";
  const page = parseInt(params.page || "1", 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  // 获取真实博客数据
  const posts = await prisma.page.findMany({
    where: {
      type: "BLOG",
      status: "PUBLISHED",
      ...(searchQuery ? {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { excerpt: { contains: searchQuery, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  // 根据分类筛选（简单匹配标题关键词）
  const filteredPosts = selectedCategory === "全部"
    ? posts
    : posts.filter(post =>
        post.title.includes(selectedCategory) ||
        post.excerpt?.includes(selectedCategory)
      );

  const total = filteredPosts.length;
  const paginatedPosts = filteredPosts.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit);

  const buildPageUrl = (pageNum: number) => {
    const sp = new URLSearchParams();
    if (searchQuery) sp.set("q", searchQuery);
    if (selectedCategory !== "全部") sp.set("category", selectedCategory);
    sp.set("page", pageNum.toString());
    return `/blog?${sp.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <BookOpen className="w-4 h-4" />
              {total}+ 篇专业文章
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">求职干货博客</h1>
            <p className="text-xl text-blue-100 mb-8">
              薪资报告、面试攻略、行业趋势分析
              <br />
              助你快速拿到理想Offer
            </p>

            {/* Search Form */}
            <form action="/blog" className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="搜索文章..."
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-12">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/blog?category=${encodeURIComponent(cat.name)}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
              className={`px-5 py-3 rounded-xl text-center transition-all ${
                selectedCategory === cat.name
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md"
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Search Results Info */}
        {(searchQuery || selectedCategory !== "全部") && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              找到 <span className="font-semibold">{total}</span> 篇文章
              {searchQuery && (
                <>
                  {" "}
                  匹配 "<span className="font-semibold">{searchQuery}</span>"
                </>
              )}
            </p>
            <Link
              href="/blog"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              清除筛选
            </Link>
          </div>
        )}

        {/* Post Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">最新文章</h2>
          </div>

          {paginatedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="relative h-48">
                    {post.featuredImage ? (
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt || ""}</p>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {post.author?.name || "JobsBro"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {post.createdAt.toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">未找到相关文章</h3>
              <p className="text-gray-500 mb-6">尝试使用其他关键词</p>
              <Link
                href="/blog"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all inline-block"
              >
                查看全部文章
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={buildPageUrl(page - 1)}
                  className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </Link>
              )}

              <div className="flex items-center gap-1">
                {page > 3 && (
                  <>
                    <Link
                      href={buildPageUrl(1)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      1
                    </Link>
                    {page > 4 && <span className="px-2 text-gray-400">...</span>}
                  </>
                )}

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Link
                      key={pageNum}
                      href={buildPageUrl(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-all ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}

                {page < totalPages - 2 && (
                  <>
                    {page < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                    <Link
                      href={buildPageUrl(totalPages)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      {totalPages}
                    </Link>
                  </>
                )}
              </div>

              {page < totalPages && (
                <Link
                  href={buildPageUrl(page + 1)}
                  className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
