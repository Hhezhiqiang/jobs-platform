import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { Building2, ArrowLeft, Filter, TrendingUp, Users, Target } from "lucide-react";
import { InterviewExperienceCard } from "@/components/interview/interview-experience-card";
import { logger } from '@/lib/logger';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const companies = await prisma.companies.findMany({
      where: { slug: { not: "" } },
      select: { slug: true },
      take: 500,
    });
    return companies.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const company = await prisma.companies.findUnique({
      where: { slug },
      select: { name: true },
    });

    if (!company) {
      return { title: "公司未找到" };
    }

    return {
      title: `${company.name}面试经验 - 面试题库 | Web3Career`,
      description: `查看${company.name}的真实面试经验分享，包括面试题目、面试流程、难度评估等。为求职者提供有价值的面试准备参考。`,
    };
  } catch {
    return { title: "面试题库" };
  }
}

async function getCompanyInterviewData(slug: string, page: number = 1) {
  try {
    const company = await prisma.companies.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        industry: true,
      },
    });

    if (!company) return null;

    // 获取面试经验（类型为INTERVIEW的职业故事）
    const limit = 12;
    const skip = (page - 1) * limit;

    const interviews = await prisma.career_stories.findMany({
      where: {
        type: "EXPERIENCE",
        companyId: company.id,
      },
      orderBy: [
        { resonanceCount: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const total = await prisma.career_stories.count({
      where: { type: "EXPERIENCE", companyId: company.id },
    });

    // 解析面试经验数据
    const formattedInterviews = interviews.map((story) => {
      const parsedData = parseInterviewContent(story.content);
      return {
        ...story,
        ...parsedData,
      };
    });

    // 统计分析（仅当前公司数据）
    const allInterviews = await prisma.career_stories.findMany({
      where: { type: "EXPERIENCE", companyId: company.id },
      select: {
        content: true,
        resonanceCount: true,
      },
    });

    const allParsedData = allInterviews.map((i) => parseInterviewContent(i.content));

    const stats = {
      totalInterviews: total,
      passedCount: allParsedData.filter((i) => i.result === "passed").length,
      failedCount: allParsedData.filter((i) => i.result === "failed").length,
      avgDifficulty: calculateAvgDifficulty(allParsedData),
      topDepartments: extractTopDepartments(allParsedData),
      topQuestions: extractTopQuestions(allParsedData),
    };

    return {
      company,
      interviews: formattedInterviews,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("获取面试数据失败:", error);
    return null;
  }
}

/**
 * 解析面试故事内容
 */
function parseInterviewContent(content: string) {
  const result: any = {};

  result.summary = content.slice(0, 150).trim();
  if (content.length > 150) result.summary += "...";

  // 匹配部门
  const departmentMatch = content.match(/部门[：:]\s*(.+?)(?:\n|$)/i);
  if (departmentMatch) result.department = departmentMatch[1].trim();

  // 匹配岗位
  const positionMatch = content.match(/(?:岗位|职位)[：:]\s*(.+?)(?:\n|$)/i);
  if (positionMatch) result.position = positionMatch[1].trim();

  // 匹配面试结果
  if (/面试通过|拿到offer|成功入职|已通过|录取/i.test(content)) {
    result.result = "passed";
  } else if (/面试未通过|没通过|被拒|失败|未录取/i.test(content)) {
    result.result = "failed";
  } else {
    result.result = "unknown";
  }

  // 匹配难度
  if (/非常难|很难|难度高/i.test(content)) result.difficulty = 5;
  else if (/比较难|有难度/i.test(content)) result.difficulty = 4;
  else if (/中等难度|一般/i.test(content)) result.difficulty = 3;
  else if (/比较简单|不太难/i.test(content)) result.difficulty = 2;
  else if (/很简单|非常容易/i.test(content)) result.difficulty = 1;

  // 提取问题
  const questionMatches = content.match(/(?:^|\n)(?:\d+[.．、]|Q\d*[：:]?|问题[\d]*[：:]?)\s*(.+?)(?=\n|$)/gi);
  if (questionMatches) {
    result.questions = questionMatches
      .map((q) => q.replace(/(?:^|\n)(?:\d+[.．、]|Q\d*[：:]?|问题[\d]*[：:]?)\s*/, "").trim())
      .filter((q) => q.length > 5 && q.length < 200)
      .slice(0, 5);
  }

  // 提取标签
  const tagMatches = content.match(/#[\w\u4e00-\u9fa5]+/g);
  if (tagMatches) result.tags = tagMatches.map((t) => t.replace("#", ""));

  return result;
}

function calculateAvgDifficulty(data: any[]): number {
  const valid = data.filter((i) => i.difficulty !== undefined);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, i) => acc + i.difficulty, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

function extractTopDepartments(data: any[]): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  data.forEach((i) => {
    if (i.department) counts[i.department] = (counts[i.department] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function extractTopQuestions(data: any[]): { question: string; count: number }[] {
  const counts: Record<string, number> = {};
  data.forEach((i) => {
    if (i.questions) {
      i.questions.forEach((q: string) => {
        const simplified = q.slice(0, 30);
        counts[simplified] = (counts[simplified] || 0) + 1;
      });
    }
  });
  return Object.entries(counts)
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export default async function CompanyInterviewsPage({ params, searchParams }: PageProps) {
  const { slug, locale } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt((resolvedSearchParams?.page as string) || "1", 10);

  const data = await getCompanyInterviewData(slug, page);

  if (!data) {
    notFound();
  }

  const { company, interviews, stats, pagination } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-blue-100 mb-6">
            <Link href={`/${locale}/companies`} className="hover:text-white">
              公司
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/${locale}/companies/${company.slug}`} className="hover:text-white">
              {company.name}
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white">面试经验</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {company.logo ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-2xl font-bold text-blue-600 shadow-2xl">
                {company.name.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {company.name} 面试经验
              </h1>
              <p className="text-blue-100">
                共 {stats.totalInterviews} 条真实面试分享 · 通过率{" "}
                {stats.totalInterviews > 0
                  ? Math.round((stats.passedCount / stats.totalInterviews) * 100)
                  : 0}
                %
              </p>
            </div>

            <Link
              href={`/${locale}/companies/${company.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              返回公司主页
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧：统计与筛选 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 统计概览 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                面试统计
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">面试总数</span>
                  <span className="font-semibold text-gray-900">{stats.totalInterviews}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">已通过</span>
                  <span className="font-semibold text-green-600">{stats.passedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">未通过</span>
                  <span className="font-semibold text-red-600">{stats.failedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">平均难度</span>
                  <span className="font-semibold text-gray-900">
                    {stats.avgDifficulty > 0 ? `${stats.avgDifficulty}/5` : "暂无"}
                  </span>
                </div>
              </div>
            </div>

            {/* 热门部门 */}
            {stats.topDepartments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  热门部门
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.topDepartments.map((dept) => (
                    <span
                      key={dept.name}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg"
                    >
                      {dept.name} ({dept.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 热门问题 */}
            {stats.topQuestions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  常见问题
                </h3>
                <div className="space-y-3">
                  {stats.topQuestions.slice(0, 6).map((q, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 text-xs rounded-full flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-600 line-clamp-2">{q.question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：面试经验列表 */}
          <div className="lg:col-span-3">
            {/* 筛选栏 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Filter className="w-5 h-5" />
                  <span className="font-medium">筛选：</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                    全部
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-all">
                    技术岗
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-all">
                    产品岗
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-all">
                    运营岗
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-all">
                    已通过
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-all">
                    未通过
                  </button>
                </div>
              </div>
            </div>

            {/* 面试经验列表 */}
            {interviews.length > 0 ? (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <InterviewExperienceCard
                    key={interview.id}
                    interview={interview}
                    locale={locale}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无面试经验</h3>
                <p className="text-gray-500">成为第一个分享{company.name}面试经验的人</p>
                <Link
                  href={`/${locale}/career-trail/create?type=INTERVIEW&company=${company.slug}`}
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  分享面试经验
                </Link>
              </div>
            )}

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/${locale}/companies/${slug}/interviews?page=${p}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
