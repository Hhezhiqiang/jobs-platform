import Link from "next/link";
import Image from "next/image";
import { getHomePageData } from "@/lib/optimized-queries";
import { generateHomeMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { HeroSection } from "@/components/hero-section";
import { StatsSection } from "@/components/stats-section";
import { FeaturesSection } from "@/components/features-section";
import { JobCardV2 } from "@/components/job-card-v2";
import { AdBanner } from "@/components/ad-banner";
import { RecommendationSection } from "@/components/recommendation-section";

export const revalidate = 60;
export const metadata: Metadata = generateHomeMetadata();

export default async function HomePage() {
  const { featuredJobs, latestJobs, hotCompanies, stats } = await getHomePageData();

  return (
    <div className="min-h-screen bg-white">
      <HeroSection jobCount={stats.jobCount} />
      
      <StatsSection jobCount={stats.jobCount} companyCount={stats.companyCount} dailyNewJobs={stats.dailyNewJobs} />

      {/* 推荐职位 - 个性化推荐 */}
      <RecommendationSection limit={6} initialJobs={featuredJobs} />

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">🔥 热招职位</h2>
                <p className="text-gray-600">精选优质岗位，助你快速入职</p>
              </div>
              <Link
                href="/jobs"
                className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
              >
                查看全部
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
                href="/jobs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
              >
                查看全部职位
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🏢 热门企业</h2>
              <p className="text-gray-600">与一线大厂和创新企业直接对话</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {hotCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.slug}`}
                  className="group flex items-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all"
                >
                  {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={`${company.name} 公司Logo`}
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
                    <p className="text-sm text-gray-500">{company.industry || "互联网"}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/companies"
                className="inline-flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all"
              >
                查看更多企业
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Latest Jobs */}
      {latestJobs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">🆕 最新职位</h2>
                <p className="text-gray-600">实时更新，第一时间掌握机会</p>
              </div>
              <Link
                href="/jobs"
                className="hidden md:inline-flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all"
              >
                查看全部
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
              <h2 className="text-3xl font-bold text-white mb-4">📝 职场干货</h2>
              <p className="text-blue-100 text-lg">{stats.blogCount}+ 篇专业文章，助你职场进阶</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "🎯", title: "求职技巧", desc: "简历优化、面试攻略、谈薪技巧" },
                { icon: "💼", title: "职业发展", desc: "行业洞察、技能提升、转型指南" },
                { icon: "📊", title: "薪资报告", desc: "各岗位薪资水平、行业趋势分析" },
              ].map((item) => (
                <Link
                  key={item.title}
                  href="/blog"
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
                href="/blog"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
              >
                阅读更多文章
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
            准备好开启新的职业旅程了吗？
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            立即注册，发现更多优质职位机会
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              免费注册
            </Link>
            <Link
              href="/jobs"
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              浏览职位
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
