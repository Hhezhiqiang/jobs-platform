"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { BookOpen, TrendingUp, Users, Clock, Search, ChevronRight, X } from "lucide-react";

// 模拟博客数据（实际应该从API获取）
const mockPosts = [
  {
    id: "1",
    title: "2026年互联网行业薪资报告",
    excerpt: "深入分析互联网行业各岗位薪资水平，帮你了解市场行情...",
    slug: "2026-salary-report",
    featuredImage: null,
    createdAt: new Date(),
    author: { name: "JobsBro" },
    category: "行业趋势",
  },
  {
    id: "2",
    title: "产品经理面试完全攻略",
    excerpt: "从简历到面试，全方位指导你如何成功拿到产品经理offer...",
    slug: "pm-interview-guide",
    featuredImage: null,
    createdAt: new Date(Date.now() - 86400000),
    author: { name: "JobsBro" },
    category: "面试攻略",
  },
  {
    id: "3",
    title: "东京IT求职指南",
    excerpt: "详细解析日本IT行业求职流程，签证办理，薪资待遇等...",
    slug: "tokyo-it-jobs",
    featuredImage: null,
    createdAt: new Date(Date.now() - 172800000),
    author: { name: "JobsBro" },
    category: "职业发展",
  },
];

const categories = [
  { name: "全部", icon: "📚", count: 50 },
  { name: "面试攻略", icon: "🎯", count: 12 },
  { name: "简历优化", icon: "📝", count: 8 },
  { name: "薪资谈判", icon: "💰", count: 6 },
  { name: "职业发展", icon: "🚀", count: 15 },
  { name: "行业趋势", icon: "📊", count: 10 },
  { name: "职场技能", icon: "💡", count: 9 },
];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [filteredPosts, setFilteredPosts] = useState(mockPosts);
  const [isSearching, setIsSearching] = useState(false);

  // 搜索和筛选功能
  useEffect(() => {
    let filtered = mockPosts;

    // 按分类筛选
    if (selectedCategory !== "全部") {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p: typeof mockPosts[0]) =>
          p.title.toLowerCase().includes(query) ||
          p.excerpt.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(filtered);
  }, [searchQuery, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 500);
  };

  const clearSearch = () => {
    setSearchQuery("");
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
              {filteredPosts.length}+ 篇专业文章
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">求职干货博客</h1>
            <p className="text-xl text-blue-100 mb-8">
              薪资报告、面试攻略、行业趋势分析
              <br />
              助你快速拿到理想Offer
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-5 py-3 rounded-xl text-center transition-all ${
                selectedCategory === cat.name
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md"
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
              <span className="ml-2 text-sm opacity-75">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Search Results Info */}
        {(searchQuery || selectedCategory !== "全部") && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              找到 <span className="font-semibold">{filteredPosts.length}</span> 篇文章
              {searchQuery && (
                <>
                  {" "}
                  匹配 "<span className="font-semibold">{searchQuery}</span>"
                </>
              )}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("全部");
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              清除筛选
            </button>
          </div>
        )}

        {/* Featured Post */}
        {filteredPosts.length > 0 && !searchQuery && selectedCategory === "全部" && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold">精选文章</h2>
            </div>

            <Link
              href={`/blog/${filteredPosts[0].slug}`}
              className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-64 md:h-auto">
                  {filteredPosts[0].featuredImage ? (
                    <Image
                      src={filteredPosts[0].featuredImage}
                      alt={filteredPosts[0].title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      精选
                    </span>
                    <span className="text-gray-400">
                      {filteredPosts[0].createdAt.toLocaleDateString("zh-CN")}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {filteredPosts[0].title}
                  </h3>

                  <p className="text-gray-600 mb-6 line-clamp-3">{filteredPosts[0].excerpt}</p>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {filteredPosts[0].author.name?.charAt(0) || "A"}
                    </div>
                    <span className="text-gray-700">{filteredPosts[0].author.name}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Post Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {filteredPosts.length > 0 ? "最新文章" : "搜索结果"}
            </h2>
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.slice(searchQuery || selectedCategory !== "全部" ? 0 : 1).map((post) => (
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
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                        {post.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {post.author.name}
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
              <p className="text-gray-500 mb-6">尝试使用其他关键词或选择其他分类</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("全部");
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
              >
                查看全部文章
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
