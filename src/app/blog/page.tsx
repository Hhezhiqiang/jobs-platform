import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Metadata } from "next";
import { BookOpen, TrendingUp, Users, Clock, Search, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "求职博客 - 薪资报告、面试攻略、行业趋势 | 招聘平台",
  description: "互联网求职干货：2026薪资报告、产品经理面试攻略、东京IT求职指南、简历优化技巧。专家级内容助你快速拿到理想Offer。",
  keywords: ["求职博客", "薪资报告", "面试攻略", "产品经理", "东京IT求职"],
};

export default async function BlogPage() {
  const posts = await prisma.page.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });

  const categories = [
    { name: "面试攻略", icon: "🎯", count: 12 },
    { name: "简历优化", icon: "📝", count: 8 },
    { name: "薪资谈判", icon: "💰", count: 6 },
    { name: "职业发展", icon: "🚀", count: 15 },
    { name: "行业趋势", icon: "📊", count: 10 },
    { name: "职场技能", icon: "💡", count: 9 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <BookOpen className="w-4 h-4" />
              {posts.length}+ 篇专业文章
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">求职干货博客</h1>
            <p className="text-xl text-blue-100 mb-8">
              薪资报告、面试攻略、行业趋势分析<br />
              助你快速拿到理想Offer
            </p>

            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="搜索文章..."
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <p className="font-medium text-gray-900">{cat.name}</p>
              <p className="text-sm text-gray-500">{cat.count} 篇</p>
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {posts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold">精选文章</h2>
            </div>

            <Link 
              href={`/blog/${posts[0].slug}`}
              className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-64 md:h-auto">
                  {posts[0].featuredImage ? (
                    <Image
                      src={posts[0].featuredImage}
                      alt={posts[0].title}
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
                    <span className="text-gray-400">{posts[0].createdAt.toLocaleDateString("zh-CN")}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {posts[0].title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {posts[0].excerpt}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {posts[0].author.name?.charAt(0) || "A"}
                    </div>
                    <span className="text-gray-700">{posts[0].author.name}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Post Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">最新文章</h2>
            <Link href="/blog/all" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map((post) => (
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
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  
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
        </div>

        {posts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无博客文章</h3>
            <p className="text-gray-500">敬请期待精彩内容</p>
          </div>
        )}
      </main>
    </div>
  );
}
