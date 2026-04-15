import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StoryCard } from "./components/StoryCard";
import { FilterTabs } from "./components/FilterTabs";
import { HotStories } from "./components/HotStories";
import { RecommendedUsers } from "./components/RecommendedUsers";
import { PenLine, TrendingUp } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";

export const metadata: Metadata = {
  title: "职迹 - 记录职业成长，分享真实经历 | JobsBro招聘平台",
  description: "在JobsBro职迹社区分享你的职业转型故事、面试复盘、职场感悟和技能进化历程。与万千职场人共鸣，共同成长。",
  keywords: ["职迹", "职业成长", "转型故事", "面试复盘", "职场感悟", "技能进化", "职业发展", "职场社区"],
  openGraph: {
    title: "职迹 - 记录职业成长，分享真实经历",
    description: "分享你的职业转型故事、面试复盘、职场感悟和技能进化历程",
    url: `${SITE_URL}/career-trail`,
    siteName: "JobsBro招聘平台",
    type: "website",
    locale: "zh_CN",
    images: [`${SITE_URL}/logo.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/career-trail`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const revalidate = 60;

interface PageProps {
  params: { locale: string };
  searchParams: Promise<{ type?: string; page?: string }>;
}

export default async function CareerTrailPage({ params, searchParams }: PageProps) {
  const { locale } = params;
  const search = await searchParams;
  const type = search.type || "all";
  const currentPage = parseInt(search.page || "1", 10);
  const limit = 9;

  // 构建查询条件
  const where: any = {};
  if (type && type !== "all") {
    where.type = type.toUpperCase();
  }

  // 获取故事列表
  const [stories, total, featuredStories] = await Promise.all([
    prisma.careerStory.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.careerStory.count({ where }),
    prisma.careerStory.findMany({
      where: { isFeatured: true },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { resonanceCount: "desc" },
      take: 3,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6">
              <span>✨</span>
              已有 {total.toLocaleString()} 个职场故事
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              职迹 - 记录职业成长，分享真实经历
            </h1>
            <p className="text-xl text-white/90 mb-8">
              <span className="inline-flex items-center gap-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">转型日记</span>
                <span>·</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">面试复盘</span>
                <span>·</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">职场顿悟</span>
              </span>
            </p>

            <Link
              href={`/${locale}/career-trail/write`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <PenLine className="w-5 h-5" />
              分享我的故事
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <FilterTabs selectedType={type} locale={locale} />

            {/* Stories Grid */}
            {stories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stories.map((story) => (
                  <StoryCard key={story.id} story={story} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <PenLine className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">暂无相关故事</h3>
                <p className="text-gray-500 mb-6">成为第一个分享的人吧</p>
                <Link
                  href={`/${locale}/career-trail/write`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                >
                  <PenLine className="w-4 h-4" />
                  分享我的故事
                </Link>
              </div>
            )}

            {/* Load More / Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {currentPage > 1 && (
                  <Link
                    href={`/${locale}/career-trail?${type !== "all" ? `type=${type}&` : ""}page=${currentPage - 1}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-600"
                  >
                    上一页
                  </Link>
                )}

                <span className="px-4 py-2 text-gray-600">
                  第 {currentPage} / {totalPages} 页
                </span>

                {currentPage < totalPages && (
                  <Link
                    href={`/${locale}/career-trail?${type !== "all" ? `type=${type}&` : ""}page=${currentPage + 1}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-600"
                  >
                    下一页
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-8">
            {/* Hot Stories */}
            <HotStories />

            {/* Recommended Users */}
            <RecommendedUsers />

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                社区数据
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600">{total.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">故事分享</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-xl">
                  <div className="text-2xl font-bold text-pink-600">15.2k</div>
                  <div className="text-sm text-gray-600">获得共鸣</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">8,391</div>
                  <div className="text-sm text-gray-600">职场人</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <div className="text-2xl font-bold text-amber-600">4.8k</div>
                  <div className="text-sm text-gray-600">面试复盘</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
