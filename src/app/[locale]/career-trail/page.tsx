import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PenLine, TrendingUp, Heart, MessageCircle, Briefcase, ArrowRight } from "lucide-react";
import { JobSeekerCard } from "@/components/career-trail/job-seeker-card";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

// 前端类型与数据库类型的映射
type StoryTypeUI = "all" | "transformation" | "interview" | "insight" | "skill";
type StoryTypeDB = "EXPERIENCE" | "TRANSITION" | "MILESTONE" | "CHALLENGE" | "INSIGHT";

// 类型映射：UI类型 -> DB类型
const typeMapping: Record<StoryTypeUI, StoryTypeDB[]> = {
  all: ["EXPERIENCE", "TRANSITION", "MILESTONE", "CHALLENGE", "INSIGHT"],
  transformation: ["TRANSITION"], // 转型日记
  interview: ["EXPERIENCE"], // 面试复盘
  insight: ["INSIGHT", "MILESTONE"], // 职场顿悟
  skill: ["CHALLENGE"], // 技能进化
};

// 类型标签配置
const typeLabelsZh: Record<StoryTypeUI, { label: string; icon: string; color: string; bgColor: string }> = {
  all: { label: "全部", icon: "📚", color: "text-gray-600", bgColor: "bg-gray-50" },
  transformation: { label: "转型日记", icon: "🔄", color: "text-purple-600", bgColor: "bg-purple-50" },
  interview: { label: "面试复盘", icon: "🎯", color: "text-blue-600", bgColor: "bg-blue-50" },
  insight: { label: "职场顿悟", icon: "💡", color: "text-amber-600", bgColor: "bg-amber-50" },
  skill: { label: "技能进化", icon: "🚀", color: "text-emerald-600", bgColor: "bg-emerald-50" },
};
const typeLabelsEn: Record<StoryTypeUI, { label: string; icon: string; color: string; bgColor: string }> = {
  all: { label: "All", icon: "📚", color: "text-gray-600", bgColor: "bg-gray-50" },
  transformation: { label: "Transformation", icon: "🔄", color: "text-purple-600", bgColor: "bg-purple-50" },
  interview: { label: "Interview Review", icon: "🎯", color: "text-blue-600", bgColor: "bg-blue-50" },
  insight: { label: "Insights", icon: "💡", color: "text-amber-600", bgColor: "bg-amber-50" },
  skill: { label: "Skill Growth", icon: "🚀", color: "text-emerald-600", bgColor: "bg-emerald-50" },
};

// 根据DB类型获取UI类型
function getUIType(dbType: StoryTypeDB): StoryTypeUI {
  const mapping: Record<StoryTypeDB, StoryTypeUI> = {
    TRANSITION: "transformation",
    EXPERIENCE: "interview",
    INSIGHT: "insight",
    CHALLENGE: "skill",
    MILESTONE: "insight",
  };
  return mapping[dbType];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Career Stories - Share Real Experiences | JobQuip" : "职迹 - 记录职业成长，分享真实经历",
    description: isEn ? "Share your career transformation stories, interview reviews, workplace insights and skill growth journeys." : "在JobQuip职迹社区分享你的职业转型故事、面试复盘、职场感悟和技能进化历程。",
    keywords: isEn ? ["career stories", "career growth", "interview review", "workplace insights"] : ["职迹", "职业成长", "转型故事", "面试复盘", "职场感悟"],
    openGraph: { title: isEn ? "Career Stories" : "职迹", description: isEn ? "Share real career experiences" : "分享真实职业经历", url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com"}/${locale}/career-trail`, siteName: "JobQuip", type: "website", locale: isEn ? "en_US" : "zh_CN", images: [`${process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com"}/logo.png`] },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com"}/${locale}/career-trail` },
    robots: { index: true, follow: true },
  };
}

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; page?: string }>;
}

// 格式化时间
function formatTime(date: Date, isEn: boolean) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return isEn ? "Just now" : "刚刚";
  if (minutes < 60) return isEn ? `${minutes}m ago` : `${minutes}分钟前`;
  if (hours < 24) return isEn ? `${hours}h ago` : `${hours}小时前`;
  if (days < 7) return isEn ? `${days}d ago` : `${days}天前`;
  return new Date(date).toLocaleDateString(isEn ? "en-US" : "zh-CN", { month: "short", day: "numeric" });
}

// 获取正在求职的用户
async function getJobSeekers(limit = 6) {
  const jobSeekers = await prisma.jobSeekingStatus.findMany({
    where: {
      status: { in: ["OPEN", "PASSIVE"] },
      privacy: { in: ["PUBLIC", "CIRCLES"] },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { lastActiveAt: "desc" },
    take: limit,
  });

  return jobSeekers;
}

export default async function CareerTrailPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const isEn = locale === "en";
  const search = await searchParams;
  const type = (search.type as StoryTypeUI) || "all";
  const currentPage = parseInt(search.page || "1", 10);
  const limit = 20;

  // 获取对应的数据库类型
  const dbTypes = typeMapping[type];

  // 构建查询条件
  const where: any = {
    type: { in: dbTypes },
  };

  // 获取故事列表、热门故事和正在求职的用户
  const [stories, total, hotStories, jobSeekers] = await Promise.all([
    prisma.careerStory.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { resonances: true, storyComments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.careerStory.count({ where }),
    prisma.careerStory.findMany({
      where: {},
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { resonances: true, storyComments: true },
        },
      },
      orderBy: { resonanceCount: "desc" },
      take: 5,
    }),
    getJobSeekers(6),
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
              {isEn ? `${total.toLocaleString()} stories` : `已有 ${total.toLocaleString()} 个职场故事`}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {isEn ? "Career Stories" : "职迹"}
            </h1>
            <p className="text-xl text-white/90 mb-8">
              {isEn ? "Record career growth, share real experiences" : "记录职业成长，分享真实经历"}
            </p>

            <Link
              href={`/${locale}/career-trail/write`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <PenLine className="w-5 h-5" />
              {isEn ? "Write Story" : "写故事"}
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
              {(Object.keys(typeLabelsZh) as StoryTypeUI[]).map((typeKey) => {
                const isActive = type === typeKey;
                const config = (isEn ? typeLabelsEn[typeKey] : typeLabelsZh[typeKey]);
                return (
                  <Link
                    key={typeKey}
                    href={
                      typeKey !== "all"
                        ? `/${locale}/career-trail?type=${typeKey}`
                        : `/${locale}/career-trail`
                    }
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    <span>{config.icon}</span>
                    {config.label}
                  </Link>
                );
              })}
            </div>

            {/* 正在求职的用户卡片区域 */}
            {jobSeekers.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    {isEn ? "Open to Work" : "正在求职"}
                  </h3>
                  <Link 
                    href={`/${locale}/dashboard/job-status`}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {isEn ? "Show mine too" : "我也要展示"} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobSeekers.map((seeker) => (
                    <JobSeekerCard
                      key={seeker.id}
                      seeker={{
                        id: seeker.id,
                        user: seeker.user,
                        status: seeker.status as "OPEN" | "PASSIVE",
                        bio: seeker.bio,
                        expectTags: seeker.expectTags,
                        lastActiveAt: seeker.lastActiveAt.toISOString(),
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stories Feed Grid */}
            {stories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stories.map((story) => {
                  const uiType = getUIType(story.type as StoryTypeDB);
                  const typeConfig = (isEn ? typeLabelsEn[uiType] : typeLabelsZh[uiType]);
                  const summary = story.content.slice(0, 120) + "...";
                  
                  return (
                    <Link
                      key={story.id}
                      href={`/${locale}/career-trail/${story.id}`}
                      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="p-6">
                        {/* Author & Type */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {story.author.avatar ? (
                                <Image
                                  src={story.author.avatar}
                                  alt={story.author.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                story.author.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{story.author.name}</div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 ${typeConfig.bgColor} ${typeConfig.color} rounded-full text-xs font-medium`}>
                            {typeConfig.icon} {typeConfig.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {story.title}
                        </h3>

                        {/* Content Preview */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {summary}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <Heart className="w-4 h-4 text-pink-400" />
                              <span>{story.resonanceCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageCircle className="w-4 h-4 text-blue-400" />
                              <span>{story._count.storyComments}</span>
                            </div>
                          </div>
                          <span className="text-gray-400">{formatTime(story.createdAt, isEn)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <PenLine className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{isEn ? "No stories yet" : "暂无相关故事"}</h3>
                <p className="text-gray-500 mb-6">{isEn ? "Be the first to share" : "成为第一个分享的人吧"}</p>
                <Link
                  href={`/${locale}/career-trail/write`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                >
                  <PenLine className="w-4 h-4" />
                  {isEn ? "Share My Story" : "分享我的故事"}
                </Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {currentPage > 1 && (
                  <Link
                    href={`/${locale}/career-trail?${type !== "all" ? `type=${type}&` : ""}page=${currentPage - 1}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-600"
                  >
                    {isEn ? "Previous" : "上一页"}
                  </Link>
                )}

                <span className="px-4 py-2 text-gray-600">
                  {isEn ? `Page ${currentPage} / ${totalPages}` : `第 ${currentPage} / ${totalPages} 页`}
                </span>

                {currentPage < totalPages && (
                  <Link
                    href={`/${locale}/career-trail?${type !== "all" ? `type=${type}&` : ""}page=${currentPage + 1}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-600"
                  >
                    {isEn ? "Next" : "下一页"}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-8">
            {/* 求职状态快捷入口 */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">{isEn ? "Looking for new opportunities?" : "正在寻找新机会？"}</h3>
              <p className="text-blue-100 text-sm mb-4">
                {isEn ? "Enable job-seeking status for community recommendations" : "开启求职状态，让圈内人帮你推荐合适的职位"}
              </p>
              <Link
                href={`/${locale}/dashboard/job-status`}
                className="block w-full py-3 bg-white text-blue-600 rounded-xl font-semibold text-center hover:bg-blue-50 transition-all"
              >
                {isEn ? "Set Job-Seeking Status" : "设置求职状态"}
              </Link>
            </div>

            {/* Hot Stories - 按resonanceCount排序 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                {isEn ? "Trending Stories" : "热门故事"}
              </h3>
              <div className="space-y-4">
                {hotStories.map((story, index) => (
                  <Link
                    key={story.id}
                    href={`/${locale}/career-trail/${story.id}`}
                    className="group flex items-start gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors"
                  >
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        index < 3
                          ? "bg-gradient-to-br from-rose-500 to-orange-400 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {story.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-400" />
                          {story.resonanceCount} 共鸣
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-blue-400" />
                          {story._count.storyComments} 评论
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                {isEn ? "Community Stats" : "社区数据"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600">{total.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{isEn ? "Stories" : "故事分享"}</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-xl">
                  <div className="text-2xl font-bold text-pink-600">
                    {hotStories.reduce((sum, s) => sum + s.resonanceCount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">{isEn ? "Resonances" : "获得共鸣"}</div>
                </div>
              </div>
              {/* 求职人数统计 */}
              {jobSeekers.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{jobSeekers.length}</div>
                    <div className="text-sm text-gray-600">正在求职</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
