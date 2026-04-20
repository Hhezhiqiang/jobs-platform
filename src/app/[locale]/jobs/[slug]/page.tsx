import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { generateJobMetadata } from "@/lib/metadata";
import { generateJobPostingSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/lib/schema";
import { ApplyButton } from "@/components/apply-button";
import { JobViewTracker } from "@/components/job-view-tracker";
import { GameJobViewTracker } from "@/components/game/trackers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Metadata } from "next";
import { MapPin, Briefcase, DollarSign, Clock, Building2, Share2, Heart, Calendar, MessageSquare, Target, TrendingUp } from "lucide-react";
import { formatDistanceToNow, formatSalary } from "@/lib/utils";
import { ensureHttpProtocol, safeJsonLdStringify } from "@/lib/utils";
import { ContactUnlockCard } from "@/components/contact-unlock-card";
import { InterviewExperienceCard } from "@/components/interview/interview-experience-card";

const employmentTypeMap: Record<string, string> = {
  FULL_TIME: "全职",
  PART_TIME: "兼职",
  CONTRACT: "合同工",
  INTERNSHIP: "实习",
  FREELANCE: "自由职业",
};

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const jobs = await prisma.jobs.findMany({
      where: { status: "ACTIVE", slug: { not: "" } },
      select: { slug: true },
      take: 500,
    });
    return jobs.map((j) => ({ slug: j.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug, locale } = await params;
    const job = await prisma.jobs.findUnique({
      where: { slug },
      include: { companies: true },
    });

    if (!job) {
      return { title: "职位未找到" };
    }

    return generateJobMetadata(job, locale);
  } catch {
    return { title: "职位未找到" };
  }
}

/**
 * 获取公司面试经验
 */
async function getCompanyInterviews(companyId: string, limit: number = 3) {
  try {
    const interviews = await prisma.careerStory.findMany({
      where: {
        type: "EXPERIENCE",
      },
      orderBy: [
        { resonanceCount: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return interviews.map((story) => {
      const parsedData = parseInterviewContent(story.content);
      return {
        ...story,
        ...parsedData,
      };
    });
  } catch (error) {
    console.error("获取面试经验失败:", error);
    return [];
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

  return result;
}

export default async function JobDetailPage({ params, searchParams }: PageProps) {
  const { slug, locale } = await params;
  const resolvedSearchParams = await searchParams;
  const activeTab = (resolvedSearchParams?.tab as string) || "description";
  
  let job = null;
  let dbError = false;
  
  try {
    job = await prisma.jobs.findUnique({
      where: { slug },
      include: { companies: true },
    });
  } catch (error) {
    console.error("Database error:", error);
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">服务暂时不可用</h3>
          <p className="text-gray-500 mb-6">数据库连接失败，请稍后重试</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
          >
            返回职位列表
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    notFound();
  }
  
  // 检查登录状态
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  // 检查是否已解锁联系方式
  let isContactUnlocked = false;
  if (isLoggedIn && job) {
    const order = await prisma.contact_unlock_orders.findFirst({
      where: {
        userId: session.user.id,
        jobId: job.id,
        status: "PAID",
      },
    });
    isContactUnlocked = !!order;
  }

  // 获取公司面试经验
  const companyInterviews = await getCompanyInterviews(job.companyId);
  const hasInterviews = companyInterviews.length > 0;

  const jobSchema = generateJobPostingSchema(job);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "首页", url: "/" },
    { name: "职位", url: "/jobs" },
    { name: job.title, url: `/jobs/${job.slug}` },
  ]);

  const salaryText = formatSalary(job.salaryMin, job.salaryMax);
  const dateText = new Date(job.datePosted).toLocaleDateString("zh-CN");

  // FAQ Schema - 基于职位信息生成常见问题
  const faqData = generateFAQSchema([
    {
      question: `${job.title} 的薪资待遇如何？`,
      answer: salaryText ? `${job.companies.name}招聘${job.title}，薪资范围为 ${salaryText}。具体待遇还包括${job.benefits ? job.benefits.slice(0, 100) : '公司提供的福利待遇'}。` : `${job.companies.name}正在招聘${job.title}，具体薪资面议。`,
    },
    {
      question: `${job.title} 的工作地点在哪里？`,
      answer: `该职位工作地点为 ${job.location}${job.city ? `（${job.city}）` : ''}。${job.isRemote ? '支持远程办公。' : job.isHybrid ? '支持混合办公模式。' : '需要到办公室办公。'}`,
    },
    {
      question: `${job.companies.name} 是一家什么公司？`,
      answer: job.companies.description ? `${job.companies.name}：${job.companies.description.slice(0, 200)}` : `${job.companies.name}是一家位于${job.companies.location || job.location}的企业，正在招聘${job.title}等职位。`,
    },
    {
      question: `如何申请 ${job.title} 职位？`,
      answer: `您可以通过 JobQuip招聘平台在线申请 ${job.companies.name} 的 ${job.title} 职位。点击"立即申请"按钮，填写相关信息并提交简历即可完成申请。`,
    },
  ]);

  return (
    <>
      {/* 浏览追踪器 - 客户端组件 */}
      <JobViewTracker job={job} />
      
      {/* 游戏化浏览追踪 */}
      <GameJobViewTracker jobId={job.id} />
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jobSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(faqData) }} />

      <div className="min-h-screen bg-gray-50">

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-400/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-blue-100 mb-6">
              <Link href={`/${locale}/`} className="hover:text-white">首页</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href={`/${locale}/jobs`} className="hover:text-white">职位</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white">{job.title}</span>
            </div>

            {/* Job Title & Company */}
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-blue-100">
                  <Link 
                    href={`/${locale}/companies/${job.companies.slug}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    {job.companies.name}
                  </Link>
                  <span>·</span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {dateText}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button aria-label="分享职位" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
                <button aria-label="收藏职位" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <DollarSign className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-500">薪资范围</p>
                  <p className="font-bold text-gray-900">{salaryText}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <Briefcase className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-sm text-gray-500">职位类型</p>
                  <p className="font-bold text-gray-900">{employmentTypeMap[job.employmentType] || job.employmentType}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <MapPin className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="text-sm text-gray-500">工作地点</p>
                  <p className="font-bold text-gray-900">{job.location}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <Calendar className="w-5 h-5 text-orange-600 mb-2" />
                  <p className="text-sm text-gray-500">发布日期</p>
                  <p className="font-bold text-gray-900">{new Date(job.datePosted).toLocaleDateString("zh-CN")}</p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                  <Link
                    href={`/${locale}/jobs/${job.slug}?tab=description`}
                    className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-all ${
                      activeTab === "description" || !activeTab
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    职位详情
                  </Link>
                  {hasInterviews && (
                    <Link
                      href={`/${locale}/jobs/${job.slug}?tab=interviews`}
                      className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-all ${
                        activeTab === "interviews"
                          ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        面试经验
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {companyInterviews.length}
                        </span>
                      </span>
                    </Link>
                  )}
                </div>

                {/* Tab Content */}
                <div className="p-6 md:p-8">
                  {activeTab === "interviews" && hasInterviews ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            {job.companies.name} 面试经验
                          </h2>
                          <p className="text-sm text-gray-500">
                            来自真实求职者的面试分享，帮你更好地准备面试
                          </p>
                        </div>
                        <Link
                          href={`/${locale}/companies/${job.companies.slug}/interviews`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                        >
                          查看全部
                        </Link>
                      </div>

                      <div className="space-y-4">
                        {companyInterviews.map((interview) => (
                          <InterviewExperienceCard
                            key={interview.id}
                            interview={interview}
                            locale={locale}
                            variant="compact"
                          />
                        ))}
                      </div>

                      {/* 面试统计 */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {companyInterviews.filter(i => i.result === 'passed').length}
                          </p>
                          <p className="text-sm text-gray-500">已通过</p>
                        </div>
                        <div className="text-center border-x border-gray-100">
                          <p className="text-2xl font-bold text-gray-900">
                            {companyInterviews.filter(i => i.result === 'failed').length}
                          </p>
                          <p className="text-sm text-gray-500">未通过</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {companyInterviews.length > 0 
                              ? Math.round(companyInterviews.reduce((acc, i) => acc + (i.difficulty || 3), 0) / companyInterviews.length * 10) / 10
                              : '-'
                            }/5
                          </p>
                          <p className="text-sm text-gray-500">平均难度</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">面试准备建议</p>
                            <p className="text-sm text-gray-600 mt-1">
                              根据面试经验分析，该公司的面试通常涉及技术能力、项目经验和行业理解。
                              建议提前了解{job.companies.name}的产品和业务，准备好相关案例。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">职位描述</h2>
                        <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {job.description}
                        </div>
                      </div>

                      {job.requirements && (
                        <div className="pt-6 border-t border-gray-100">
                          <h2 className="text-xl font-bold text-gray-900 mb-4">任职要求</h2>
                          <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {job.requirements}
                          </div>
                        </div>
                      )}

                      {job.benefits && (
                        <div className="pt-6 border-t border-gray-100">
                          <h2 className="text-xl font-bold text-gray-900 mb-4">福利待遇</h2>
                          <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {job.benefits}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 移动端：面试经验区域（当不在Tab中显示时） */}
              {hasInterviews && activeTab !== "interviews" && (
                <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      面试经验
                    </h3>
                    <Link
                      href={`/${locale}/jobs/${job.slug}?tab=interviews`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      查看更多
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {companyInterviews.slice(0, 2).map((interview) => (
                      <InterviewExperienceCard
                        key={interview.id}
                        interview={interview}
                        locale={locale}
                        variant="compact"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <ApplyButton
                  jobId={job.id}
                  jobTitle={job.title}
                  companyName={job.companies.name}
                  applyUrl={isLoggedIn ? job.applyUrl : undefined}
                />

                <p className="text-sm text-gray-500 text-center mt-4">
                  {isLoggedIn 
                    ? "申请后，HR将在3-5个工作日内回复" 
                    : "登录后查看申请方式"}
                </p>
              </div>

              {/* Contact Unlock Card */}
              <ContactUnlockCard
                jobId={job.id}
                contactEmail={job.companies.contactEmail}
                contactPhone={job.companies.contactPhone}
                isUnlocked={isContactUnlocked}
                price={Number(process.env.CONTACT_UNLOCK_PRICE || 5)}
                isLoggedIn={isLoggedIn}
              />

              {/* 面试经验快捷入口（桌面端） */}
              {hasInterviews && activeTab !== "interviews" && (
                <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    相关面试经验
                  </h3>
                  <div className="space-y-3">
                    {companyInterviews.slice(0, 2).map((interview) => (
                      <InterviewExperienceCard
                        key={interview.id}
                        interview={interview}
                        locale={locale}
                        variant="compact"
                      />
                    ))}
                  </div>
                  <Link
                    href={`/${locale}/companies/${job.companies.slug}/interviews`}
                    className="mt-4 block w-full py-2.5 text-center border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm"
                  >
                    查看全部面试经验
                  </Link>
                </div>
              )}

              {/* Company Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">关于公司</h3>
                <div className="flex items-center gap-4 mb-4">
                  {job.companies.logo ? (
                    <Image
                      src={job.companies.logo}
                      alt={job.companies.name}
                      width={60}
                      height={60}
                      className="rounded-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                      {job.companies.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <Link 
                      href={`/${locale}/companies/${job.companies.slug}`}
                      className="font-bold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {job.companies.name}
                    </Link>
                    <p className="text-sm text-gray-500">{job.companies.industry}</p>
                  </div>
                </div>

                {job.companies.description && (
                  <p className="text-gray-600 text-sm line-clamp-4 mb-4">
                    {job.companies.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {job.companies.size && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      {job.companies.size}
                    </div>
                  )}
                  {job.companies.website && (
                    <Link 
                      href={ensureHttpProtocol(job.companies.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      访问官网
                    </Link>
                  )}
                </div>

                <Link
                  href={`/${locale}/companies/${job.companies.slug}`}
                  className="mt-4 block w-full py-2.5 text-center border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  查看公司主页
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
