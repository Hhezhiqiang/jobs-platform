import Link from "next/link";
import Image from "next/image";
import { getHomePageData } from "@/lib/optimized-queries";
import { generateHomeMetadata } from "@/lib/metadata";
import { generateFAQSchema, generateOrganizationSchema } from "@/lib/schema";
import { safeJsonLdStringify } from "@/lib/utils";
import { Metadata } from "next";
import { HeroSection } from "@/components/hero-section";
import { StatsSection } from "@/components/stats-section";
import { FeaturesSection } from "@/components/features-section";
import { JobCardV2 } from "@/components/job-card-v2";
import { AdBanner } from "@/components/ad-banner";
import { RecommendationSection } from "@/components/recommendation-section";
import { HomeCheckinWrapper } from "@/components/game/home-checkin-wrapper";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateHomeMetadata(locale);
}

// FAQ Schema (Google Rich Snippets)
function getHomeFAQ(locale: string) {
  if (locale === "en") {
    return [
      {
        question: "What is JobQuip?",
        answer: "JobQuip is a professional job recruitment platform connecting talent with Web3, internet, and tech companies. We offer job search, company recommendations, salary insights, and interview guides.",
      },
      {
        question: "How do I find the right job?",
        answer: "On JobQuip, you can search jobs by keyword, filter by city, view company details, and get personalized recommendations through our smart recommendation system. Register to bookmark jobs and track applications.",
      },
      {
        question: "Are the job listings real?",
        answer: "Yes. All job listings on JobQuip are posted by verified companies. We verify company credentials to ensure authenticity. You can also view company details and employee reviews to understand the real work environment.",
      },
      {
        question: "Is JobQuip free for job seekers?",
        answer: "Yes, JobQuip is completely free for job seekers. You can search jobs, view company details, bookmark jobs, and submit applications — all for free. We only charge employers for job postings.",
      },
    ];
  }
  return [
    {
      question: "JobQuip 是什么平台？",
      answer: "JobQuip 是专业的求职招聘平台，汇聚 Web3、互联网、科技行业职位，为求职者和企业提供高效对接服务。我们提供职位搜索、公司推荐、薪资查询、面试攻略等功能。",
    },
    {
      question: "如何找到合适的工作？",
      answer: "在 JobQuip 上，您可以通过关键词搜索职位、按城市筛选、查看公司详情，还可以通过我们的智能推荐系统获取个性化职位推荐。注册账号后还可以收藏职位、跟踪申请进度。",
    },
    {
      question: "平台上的职位是真实的吗？",
      answer: "是的，JobQuip 上的所有职位都来自真实企业的发布。我们审核企业资质，确保职位信息真实有效。您也可以查看公司详情和员工评价，了解真实工作环境。",
    },
    {
      question: "JobQuip 提供免费服务吗？",
      answer: "是的，JobQuip 对求职者完全免费。您可以搜索职位、查看公司详情、收藏职位、投递简历，所有功能免费使用。我们仅对企业用户收取职位发布费用。",
    },
  ];
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const { featuredJobs, latestJobs, hotCompanies, stats } = await getHomePageData();
  const homeFAQ = getHomeFAQ(locale);

  return (
    <div className="min-h-screen bg-white">
      <HomeCheckinWrapper />

      <HeroSection jobCount={stats.jobCount} />
      
      <StatsSection jobCount={stats.jobCount} companyCount={stats.companyCount} dailyNewJobs={stats.dailyNewJobs} />

      <div className="max-w-7xl mx-auto px-4">
        <AdBanner position="HP_BANNER_01" className="my-8" />
      </div>

      <RecommendationSection limit={6} initialJobs={featuredJobs} />

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isEn ? "🔥 Hot Jobs" : "🔥 热招职位"}
                </h2>
                <p className="text-gray-600">
                  {isEn ? "Curated quality positions to help you land fast" : "精选优质岗位，助你快速入职"}
                </p>
              </div>
              <Link
                href={`/${locale}/jobs`}
                className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
              >
                {isEn ? "View All" : "查看全部"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {featuredJobs.slice(0, 6).map((job) => (
                <div key={job.id} className="h-full">
                  <JobCardV2 job={job} variant="featured" />
                </div>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link
                href={`/${locale}/jobs`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
              >
                {isEn ? "View All Jobs" : "查看全部职位"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      <FeaturesSection />

      {/* Hot Companies */}
      {hotCompanies.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {isEn ? "🏢 Hot Companies" : "🏢 热门企业"}
              </h2>
              <p className="text-gray-600">
                {isEn ? "Connect directly with top tech companies and innovators" : "与一线大厂和创新企业直接对话"}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {hotCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`/${locale}/companies/${company.slug}`}
                  className="group flex items-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all"
                >
                  {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={`${company.name} Logo`}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg object-cover"
                    unoptimized
                  />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {company.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{company.name}</p>
                    <p className="text-sm text-gray-500">{company.industry || (isEn ? "Tech" : "互联网")}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href={`/${locale}/companies`}
                className="inline-flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all"
              >
                {isEn ? "View More Companies" : "查看更多企业"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-5xl mx-auto px-4">
        <AdBanner position="JOB_LIST_TOP" className="my-6" />
      </div>

      {/* Latest Jobs */}
      {latestJobs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isEn ? "🆕 Latest Jobs" : "🆕 最新职位"}
                </h2>
                <p className="text-gray-600">
                  {isEn ? "Real-time updates, catch opportunities first" : "实时更新，第一时间掌握机会"}
                </p>
              </div>
              <Link
                href={`/${locale}/jobs`}
                className="hidden md:inline-flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all"
              >
                {isEn ? "View All" : "查看全部"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="space-y-4">
              {latestJobs.slice(0, 5).map((job) => (
                <JobCardV2 key={job.id} job={job} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Section */}
      {stats.blogCount > 0 && (
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                {isEn ? "📝 Career Insights" : "📝 职场干货"}
              </h2>
              <p className="text-blue-100 text-lg">
                {isEn
                  ? `${stats.blogCount}+ professional articles to advance your career`
                  : `${stats.blogCount}+ 篇专业文章，助你职场进阶`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(isEn
                ? [
                    { icon: "🎯", title: "Job Search Tips", desc: "Resume optimization, interview guides, salary negotiation" },
                    { icon: "💼", title: "Career Development", desc: "Industry insights, skill upgrades, transition guides" },
                    { icon: "📊", title: "Salary Reports", desc: "Salary benchmarks and industry trend analysis" },
                  ]
                : [
                    { icon: "🎯", title: "求职技巧", desc: "简历优化、面试攻略、谈薪技巧" },
                    { icon: "💼", title: "职业发展", desc: "行业洞察、技能提升、转型指南" },
                    { icon: "📊", title: "薪资报告", desc: "各岗位薪资水平、行业趋势分析" },
                  ]
              ).map((item) => (
                <Link
                  key={item.title}
                  href={`/${locale}/blog`}
                  className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-blue-100">{item.desc}</p>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href={`/${locale}/blog`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
              >
                {isEn ? "Read More Articles" : "阅读更多文章"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {isEn ? "Ready to Start Your Next Career Journey?" : "准备好开启新的职业旅程了吗？"}
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            {isEn ? "Sign up now to discover more quality job opportunities" : "立即注册，发现更多优质职位机会"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/auth/register`}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {isEn ? "Sign Up for Free" : "免费注册"}
            </Link>
            <Link
              href={`/${locale}/jobs`}
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              {isEn ? "Browse Jobs" : "浏览职位"}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section — SEO + AI Indexing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {isEn ? "FAQ" : "常见问题"}
          </h2>
          <div className="space-y-4">
            {homeFAQ.map((faq) => (
              <details
                key={faq.question}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 [&_summary]:cursor-pointer [&_summary]:font-semibold [&_summary]:text-gray-900 [&_summary]:list-none [&_summary]:relative [&_summary]:pr-8 [&_summary::after]:content-['+'] [&_summary::after]:absolute [&_summary::after]:right-0 [&_summary::after]:text-xl [&_summary::after]:text-blue-600 [&_summary]:text-gray-900 [&_details[open]_summary::after]:content-['−']"
              >
                <summary>{faq.question}</summary>
                <p className="mt-3 text-gray-600 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Schema — Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdStringify(generateFAQSchema(homeFAQ)),
        }}
      />
    </div>
  );
}
