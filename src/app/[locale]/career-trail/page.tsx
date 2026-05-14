import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Calendar, User, Clock, TrendingUp, BookOpen, MessageCircle } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Career Stories - JobQuip" : "职迹 - JobQuip",
    description: isEn ? "Share real career experiences and growth stories" : "分享真实职业经历和成长故事",
  };
}

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CareerTrailPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { page } = await searchParams;
  const isEn = locale === "en";
  const currentPage = parseInt(page || "1", 10);
  const limit = 9;

  // 查询职迹故事
  const [stories, total] = await Promise.all([
    prisma.pages.findMany({
      where: { type: 'CAREER_TRAIL', status: 'PUBLISHED' },
      include: {
        users: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.pages.count({ where: { type: 'CAREER_TRAIL', status: 'PUBLISHED' } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // 热门标签
  const hotTags = ['互联网', '人工智能', '金融科技', '技术管理', '职业发展', '面试经验', '职场感悟', '创业故事'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm mb-6 border border-white/20">
              <BookOpen className="w-4 h-4" />
              <span>{isEn ? "Real Stories from Real Professionals" : "真实职场故事分享"}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {isEn ? "Career Trails" : "职迹"}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
              {isEn 
                ? "Share real career experiences and growth stories"
                : "记录职业成长，分享真实经历"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 热门标签 */}
        <div className="flex flex-wrap gap-2 mb-10">
          <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {isEn ? "Hot Tags" : "热门标签"}
          </span>
          {hotTags.slice(0, 6).map((tag, i) => (
            <span key={i} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">
              {isEn ? "No stories yet" : "暂无故事"}
            </p>
          </div>
        ) : (
          <>
            {/* 故事卡片网格 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stories.map((story, index) => (
                <Link
                  key={story.id}
                  href={`/${locale}/career-trail/${story.slug}`}
                  className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 ${
                    index === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  {/* 渐变顶部条 */}
                  <div className={`h-2 bg-gradient-to-r ${
                    index === 0 ? 'from-indigo-500 via-purple-500 to-pink-500' :
                    index % 3 === 1 ? 'from-blue-500 to-cyan-500' :
                    index % 3 === 2 ? 'from-emerald-500 to-teal-500' :
                    'from-orange-500 to-amber-500'
                  }`}></div>
                  
                  <div className={`p-6 ${index === 0 ? 'md:p-8' : ''}`}>
                    {/* 标题 */}
                    <h3 className={`font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2 ${
                      index === 0 ? 'text-2xl' : 'text-lg'
                    }`}>
                      {story.title}
                    </h3>
                    
                    {/* 摘要 */}
                    <p className={`text-gray-600 mb-6 line-clamp-3 leading-relaxed ${
                      index === 0 ? 'text-base' : 'text-sm'
                    }`}>
                      {story.excerpt || story.content?.slice(0, 150) + '...'}
                    </p>
                    
                    {/* 标签 */}
                    {story.keywords && story.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {story.keywords.slice(0, 3).map((tag: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* 作者信息 */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        {story.users?.avatar ? (
                          <img src={story.users.avatar} alt={story.users.name || ''} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {story.users?.name?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{story.users?.name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(story.createdAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">{Math.ceil((story.content?.length || 500) / 500)} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-16">
                {currentPage > 1 && (
                  <Link
                    href={`/${locale}/career-trail?page=${currentPage - 1}`}
                    className="px-5 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all font-medium"
                  >
                    {isEn ? "Previous" : "上一页"}
                  </Link>
                )}
                <span className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-medium">
                  {currentPage}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={`/${locale}/career-trail?page=${currentPage + 1}`}
                    className="px-5 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all font-medium"
                  >
                    {isEn ? "Next" : "下一页"}
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
