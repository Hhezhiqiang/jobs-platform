"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, Search, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  keywords: string[];
  createdAt: Date;
  users: { name: string } | null;
}

interface BlogPageProps {
  initialPosts: BlogPost[];
  total: number;
  totalPages: number;
  currentPage: number;
  categories: { icon: string; name: string; key: string }[];
  currentCategory: string;
  locale: string;
}

function getGradient(id: string) {
  const gradients = [
    "from-[#6366f1] to-[#8b5cf6]",
    "from-[#06b6d4] to-[#0891b2]",
    "from-[#f59e0b] to-[#d97706]",
    "from-[#10b981] to-[#059669]",
    "from-[#ef4444] to-[#dc2626]",
    "from-[#ec4899] to-[#db2777]",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export function AuroraBlogPage({ initialPosts, total, totalPages, currentPage, categories, currentCategory, locale }: BlogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      {/* Aurora Blog Header */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-white/60">
              <li><Link href={`/${locale}`} className="hover:text-white transition-colors">首页</Link></li>
              <li>/</li>
              <li className="text-white">博客</li>
            </ol>
          </nav>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm mb-6 border border-white/10">
              <Sparkles className="w-4 h-4 text-[#a5b4fc]" />
              <span>140+ 篇专业文章</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              职场
              <span className="bg-gradient-to-r from-[#a5b4fc] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent"> 博客</span>
            </h1>
            <p className="text-lg text-[#c7d2fe]/80 max-w-2xl mx-auto">
              薪资报告、面试攻略、行业趋势，助你职场进阶
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="search"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-white bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                href={`/${locale}/blog${cat.key === "all" ? "" : `?category=${cat.key}`}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  currentCategory === cat.key
                    ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {initialPosts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-[#eef2ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-[#6366f1]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无文章</h3>
            <p className="text-gray-500 mb-6">尝试调整搜索条件或分类筛选</p>
            <Link href={`/${locale}/blog`} className="px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-medium hover:shadow-lg transition-all">
              查看全部文章
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialPosts.map((post) => {
              const gradient = getGradient(post.id);
              const date = new Date(post.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", { year: "numeric", month: "numeric", day: "numeric" });
              
              return (
                <Link
                  key={post.id}
                  href={`/${locale}/blog/${post.slug}`}
                  className="group aurora-card rounded-2xl overflow-hidden"
                >
                  {/* Aurora top gradient bar */}
                  <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                  
                  <div className="p-6">
                    {/* Keywords */}
                    {post.keywords && post.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.keywords.slice(0, 2).map((kw) => (
                          <span key={kw} className="px-2.5 py-1 bg-[#eef2ff] text-[#4f46e5] text-xs rounded-lg font-medium">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#4f46e5] transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {/* <span className="font-medium text-gray-900">{post.users?.name || "匿名"}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" /> */}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {date}
                        </span>
                      </div>
                      <span className="text-[#6366f1] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        阅读
                        <ChevronLeft className="w-4 h-4 rotate-180" />
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
            {currentPage > 1 && (
              <Link href={`/${locale}/blog?page=${currentPage - 1}`} className="flex items-center gap-1 px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-gray-600 hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all">
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
                  href={`/${locale}/blog?page=${page}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-all ${page === currentPage ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md" : "bg-white border border-gray-100 text-gray-600 hover:border-[#6366f1]/30"}`}
                >
                  {page}
                </Link>
              );
            })}
            {currentPage < totalPages && (
              <Link href={`/${locale}/blog?page=${currentPage + 1}`} className="flex items-center gap-1 px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-gray-600 hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all">
                下一页
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
