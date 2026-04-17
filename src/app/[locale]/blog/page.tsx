import type { pages, users } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { BookOpen, Users, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { safeJsonLdStringify } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export const metadata: Metadata = {
  title: "求职博客 - 薪资报告、面试攻略、行业趋势与职业发展 | JobsBro招聘平台",
  description: "专业的互联网求职博客，提供2026最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。涵盖前端、后端、产品、运营、数据分析等热门岗位，专家级原创内容助你快速拿到理想Offer。",
  keywords: ["求职博客", "薪资报告", "面试攻略", "简历优化", "职业规划", "大厂面经", "互联网求职", "产品经理面试", "程序员面试", "运营求职", "数据分析求职", "2026求职趋势"],
  openGraph: {
    title: "求职博客 - 薪资报告、面试攻略、行业趋势与职业发展 | JobsBro招聘平台",
    description: "专业的互联网求职博客，提供2026最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。",
    url: `${SITE_URL}/blog`,
    siteName: "JobsBro招聘平台",
    type: "website",
    locale: "zh_CN",
    images: [`${SITE_URL}/logo.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "求职博客 - 薪资报告、面试攻略、行业趋势与职业发展 | JobsBro招聘平台",
    description: "专业的互联网求职博客，提供2026最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。",
    images: [`${SITE_URL}/logo.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  robots: {
    index: true,
    follow: true,
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

type PostWithAuthor = pages & { users: users | null };

// 生成博客列表页的 Schema 数据
function generateBlogListSchema(posts: PostWithAuthor[], _total: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "JobsBro求职博客",
    description: "专业的互联网求职博客，提供薪资报告、面试攻略、行业趋势与职业发展建议。",
    url: `${SITE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "JobsBro招聘平台",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    blogPost: posts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.createdAt.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: {
        "@type": "Person",
        name: post.users?.name || "JobsBro",
      },
    })),
  };
}

function generateBreadcrumbSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "博客", item: `${SITE_URL}/blog` },
    ],
  };
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.q || "";
  const selectedCategory = params.category || "全部";
  const page = parseInt(params.page || "1", 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  // 获取真实博客数据
  const posts = await prisma.pages.findMany({
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
    include: { users: true },
    orderBy: { createdAt: "desc" },
  });

  // 根据分类筛选（优先匹配关键词，其次匹配标题/摘要）
  const filteredPosts = selectedCategory === "全部"
    ? posts
    : posts.filter(post =>
        post.keywords?.some(kw => kw.includes(selectedCategory)) ||
        post.title.includes(selectedCategory) ||
        post.excerpt?.includes(selectedCategory)
      );

  const total = filteredPosts.length;
  const paginatedPosts = filteredPosts.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit);

  const blogListSchema = generateBlogListSchema(paginatedPosts, total);
  const breadcrumbSchema = generateBreadcrumbSchema();

  const buildPageUrl = (pageNum: number) => {
    const sp = new URLSearchParams();
    if (searchQuery) sp.set("q", searchQuery);
    if (selectedCategory !== "全部") sp.set("category", selectedCategory);
    sp.set("page", pageNum.toString());
    return `/blog?${sp.toString()}`;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(blogListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }}
      />
      <div className="min-h-screen bg-gray-50">

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
                  匹配 &quot;<span className="font-semibold">{searchQuery}</span>&quot;
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
                  href={`/blog/${encodeURIComponent(post.slug)}`}
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
                        {post.users?.name || "JobsBro"}
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
    </>
  );
}
