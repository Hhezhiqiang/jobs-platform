import type { pages, users } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { BookOpen, Users, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { safeJsonLdStringify } from "@/lib/utils";

function getGradient(id: string) {
  const gradients = [
    "from-blue-400 to-blue-600",
    "from-indigo-400 to-purple-600",
    "from-pink-400 to-rose-600",
    "from-teal-400 to-emerald-600",
    "from-orange-400 to-red-600",
    "from-cyan-400 to-blue-600",
    "from-violet-400 to-fuchsia-600",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const zh = `${SITE_URL}/${locale}`;

  return {
    title: isEn
      ? "Career Blog - Salary Reports, Interview Tips & Industry Trends"
      : "求职博客 - 薪资报告、面试攻略、行业趋势与职业发展",
    description: isEn
      ? "Professional career blog with latest salary reports, interview guides, resume tips, and career development advice for tech and Web3 professionals."
      : "专业的互联网求职博客，提供2026最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。涵盖前端、后端、产品、运营、数据分析等热门岗位，专家级原创内容助你快速拿到理想Offer。",
    keywords: isEn
      ? ["career blog", "salary report", "interview tips", "resume optimization", "career development", "tech jobs", "Web3 careers", "job search guide"]
      : ["求职博客", "薪资报告", "面试攻略", "简历优化", "职业规划", "大厂面经", "互联网求职", "产品经理面试", "程序员面试", "运营求职", "数据分析求职", "2026求职趋势"],
    openGraph: {
      title: isEn
        ? "Career Blog - Salary Reports, Interview Tips & Industry Trends"
        : "求职博客 - 薪资报告、面试攻略、行业趋势与职业发展",
      description: isEn
        ? "Professional career blog with latest salary reports, interview guides, resume tips, and career development advice."
        : "专业的互联网求职博客，提供2026最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。",
      url: `${zh}/blog`,
      siteName: "JobQuip",
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
      images: [`${SITE_URL}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: isEn
        ? "Career Blog - Salary Reports, Interview Tips & Industry Trends"
        : "求职博客 - 薪资报告、面试攻略、行业趋势与职业发展",
      description: isEn
        ? "Professional career blog with latest salary reports, interview guides, resume tips, and career development advice."
        : "专业的互联网求职博客，提供2026最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。",
      images: [`${SITE_URL}/logo.png`],
    },
    alternates: {
      canonical: `${zh}/blog`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/blog`,
        "en": `${SITE_URL}/en/blog`,
        "x-default": `${SITE_URL}/zh/blog`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const revalidate = 3600;

const categoriesZh = [
  { name: "全部", icon: "📚" },
  { name: "面试攻略", icon: "🎯" },
  { name: "简历优化", icon: "📝" },
  { name: "薪资谈判", icon: "💰" },
  { name: "职业发展", icon: "🚀" },
  { name: "行业趋势", icon: "📊" },
  { name: "职场技能", icon: "💡" },
];

const categoriesEn = [
  { name: "All", icon: "📚" },
  { name: "Interview Tips", icon: "🎯" },
  { name: "Resume Tips", icon: "📝" },
  { name: "Salary Negotiation", icon: "💰" },
  { name: "Career Growth", icon: "🚀" },
  { name: "Industry Trends", icon: "📊" },
  { name: "Workplace Skills", icon: "💡" },
];

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

type PostWithAuthor = pages & { users: users | null };

function generateBlogListSchema(posts: PostWithAuthor[], _total: number, locale: string) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: locale === "en" ? "JobQuip Career Blog" : "JobQuip求职博客",
    description: locale === "en"
      ? "Professional career blog with salary reports, interview guides, industry trends and career advice."
      : "专业的互联网求职博客，提供薪资报告、面试攻略、行业趋势与职业发展建议。",
    url: `${SITE_URL}/${locale}/blog`,
    publisher: {
      "@type": "Organization",
      name: "JobQuip",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
  };
}

export default async function BlogPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const isEn = locale === "en";
  const categories = isEn ? categoriesEn : categoriesZh;

  const page = parseInt(sp.page || "1");
  const limit = 12;
  const skip = (page - 1) * limit;

  let posts: PostWithAuthor[] = [];
  let total = 0;

  try {
    const where: any = { type: "BLOG", status: "PUBLISHED" };
    if (sp.q) {
      where.OR = [
        { title: { contains: sp.q, mode: "insensitive" } },
        { excerpt: { contains: sp.q, mode: "insensitive" } },
        { content: { contains: sp.q, mode: "insensitive" } },
      ];
    }
    if (sp.category && sp.category !== (isEn ? "All" : "全部")) {
      where.category = sp.category;
    }

    const [postsData, totalData] = await Promise.all([
      prisma.pages.findMany({
        where,
        include: { users: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.pages.count({ where }),
    ]);
    posts = postsData;
    total = totalData;
  } catch {
    // db error
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdStringify(generateBlogListSchema(posts, total, locale)),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isEn ? "📝 Career Blog" : "📝 职场博客"}
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {isEn
              ? "Salary reports, interview guides, and industry trends to advance your career"
              : "薪资报告、面试攻略、行业趋势，助你职场进阶"}
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <form action={`/${locale}/blog`}>
              <input
                type="search"
                name="q"
                defaultValue={sp.q}
                placeholder={isEn ? "Search articles..." : "搜索文章..."}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20"
              />
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/${locale}/blog?category=${encodeURIComponent(cat.name)}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                sp.category === cat.name
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Posts */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isEn ? "No articles found" : "暂无文章"}
            </h2>
            <p className="text-gray-500">
              {isEn ? "Try adjusting your search or category filter" : "尝试调整搜索条件或分类筛选"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => {
              const gradient = getGradient(post.id);
              return (
                <Link
                  key={post.id}
                  href={`/${locale}/blog/${post.slug}`}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {post.featuredImage ? (
                    <div className="h-48 overflow-hidden">
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        width={400}
                        height={200}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className={`h-48 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <BookOpen className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg font-medium">
                        {post.category || (isEn ? "Career" : "职场")}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(post.createdAt).toLocaleDateString(isEn ? "en-US" : "zh-CN")}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {post.excerpt || post.content.slice(0, 120) + "..."}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {post.users?.avatar ? (
                          <Image
                            src={post.users.avatar}
                            alt={post.users.name || ""}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                            {(post.users?.name || "JQ").charAt(0)}
                          </div>
                        )}
                        <span className="text-xs text-gray-500">{post.users?.name || "JobQuip"}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {isEn ? "Read" : "阅读"} →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {page > 1 && (
              <Link
                href={`/${locale}/blog?page=${page - 1}${sp.q ? `&q=${sp.q}` : ""}${sp.category ? `&category=${sp.category}` : ""}`}
                className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                {isEn ? "Previous" : "上一页"}
              </Link>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <Link
                  key={pageNum}
                  href={`/${locale}/blog?page=${pageNum}${sp.q ? `&q=${sp.q}` : ""}${sp.category ? `&category=${sp.category}` : ""}`}
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
            {page < totalPages && (
              <Link
                href={`/${locale}/blog?page=${page + 1}${sp.q ? `&q=${sp.q}` : ""}${sp.category ? `&category=${sp.category}` : ""}`}
                className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                {isEn ? "Next" : "下一页"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
