import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { Calendar, User, Clock, ArrowLeft, Share2, Heart, MessageCircle, Bookmark, TrendingUp } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const story = await prisma.pages.findUnique({
    where: { slug, type: 'CAREER_TRAIL' },
    select: { title: true, excerpt: true }
  });
  
  if (!story) notFound();
  
  return {
    title: `${story.title} - JobQuip`,
    description: story.excerpt || story.title,
  };
}

export default async function CareerStoryPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const isEn = locale === "en";
  
  const story = await prisma.pages.findUnique({
    where: { slug, type: 'CAREER_TRAIL' },
    include: {
      users: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });
  
  if (!story) notFound();
  
  // 提取目录
  const headings = story.content?.match(/^#{2}\s+(.+)$/gm) || [];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 顶部横幅 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">
          {/* 返回按钮 */}
          <Link href={`/${locale}/career-trail`} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">{isEn ? "Back to Career Trails" : "返回职迹列表"}</span>
          </Link>
          
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">{story.title}</h1>
          
          <div className="flex flex-wrap items-center gap-6 text-white/90">
            {/* 作者信息 */}
            <div className="flex items-center gap-3">
              {story.users?.avatar ? (
                <img src={story.users.avatar} alt={story.users.name || ''} className="w-12 h-12 rounded-full border-2 border-white" />
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {story.users?.name?.[0] || 'U'}
                </div>
              )}
              <div>
                <p className="font-medium text-lg">{story.users?.name || 'Anonymous'}</p>
                <p className="text-sm text-white/70">
                  {new Date(story.createdAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            {/* 阅读时间 */}
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{Math.ceil((story.content?.length || 500) / 500)} {isEn ? "min read" : "分钟阅读"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* 主内容 */}
          <article className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-5 prose-strong:text-gray-900 prose-strong:font-semibold prose-li:text-gray-700 prose-li:leading-relaxed prose-ul:my-5 prose-ol:my-5 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown>{story.content || ''}</ReactMarkdown>
              </div>
            </div>
            
            {/* 标签 */}
            {story.keywords && story.keywords.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {story.keywords.map((tag: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 transition">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
          
          {/* 侧边栏 */}
          <aside className="space-y-6">
            {/* 目录 */}
            {headings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  {isEn ? "Table of Contents" : "目录"}
                </h3>
                <nav className="space-y-2">
                  {headings.map((heading: string, i: number) => (
                    <a
                      key={i}
                      href={`#heading-${i}`}
                      className="block text-sm text-gray-600 hover:text-indigo-600 transition-colors py-1"
                    >
                      {heading.replace(/^#{2}\s+/, '')}
                    </a>
                  ))}
                </nav>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {isEn ? "Actions" : "操作"}
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-gray-700">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm font-medium">{isEn ? "Like" : "点赞"}</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-gray-700">
                  <Bookmark className="w-5 h-5" />
                  <span className="text-sm font-medium">{isEn ? "Bookmark" : "收藏"}</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors text-gray-700">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{isEn ? "Share" : "分享"}</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors text-gray-700">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{isEn ? "Comment" : "评论"}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
