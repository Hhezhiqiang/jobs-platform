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
import { getTranslations } from "next-intl/server";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateHomeMetadata(locale);
}

// FAQ Schema (Google Rich Snippets) — 使用翻译
async function getHomeFAQ(locale: string) {
  const t = await getTranslations({ locale, namespace: "home.faq" });
  return [
    { question: t("q1"), answer: t("a1") },
    { question: t("q2"), answer: t("a2") },
    { question: t("q3"), answer: t("a3") },
    { question: t("q4"), answer: t("a4") },
  ];
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const { featuredJobs, latestJobs, hotCompanies, stats } = await getHomePageData();
  const homeFAQ = await getHomeFAQ(locale);

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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("hotJobs")}</h2>
                <p className="text-gray-600">{t("hotJobsSub")}</p>
              </div>
              <Link
                href={`/${locale}/jobs`}
                className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
              >
                {t("viewAll")}
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
                {t("viewAllJobs")}
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("hotCompanies")}</h2>
              <p className="text-gray-600">{t("hotCompaniesSub")}</p>
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
                    <p className="text-sm text-gray-500">{company.industry || (locale === "en" ? "Tech" : "互联网")}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href={`/${locale}/companies`}
                className="inline-flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all"
              >
                {t("viewMoreCompanies")}
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("latestJobs")}</h2>
                <p className="text-gray-600">{t("latestJobsSub")}</p>
              </div>
              <Link
                href={`/${locale}/jobs`}
                className="hidden md:inline-flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all"
              >
                {t("viewAll")}
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
              <h2 className="text-3xl font-bold text-white mb-4">{t("blogSection")}</h2>
              <p className="text-blue-100 text-lg">{t("blogSectionSub", { count: stats.blogCount })}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "🎯", titleKey: "blogTips.title", descKey: "blogTips.desc" },
                { icon: "💼", titleKey: "blogCareer.title", descKey: "blogCareer.desc" },
                { icon: "📊", titleKey: "blogSalary.title", descKey: "blogSalary.desc" },
              ].map((item) => (
                <Link
                  key={item.titleKey}
                  href={`/${locale}/blog`}
                  className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{t(item.titleKey)}</h3>
                  <p className="text-blue-100">{t(item.descKey)}</p>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href={`/${locale}/blog`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
              >
                {t("readMore")}
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t("cta.title")}</h2>
          <p className="text-xl text-gray-400 mb-10">{t("cta.subtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/auth/register`}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {t("cta.register")}
            </Link>
            <Link
              href={`/${locale}/jobs`}
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              {t("cta.browseJobs")}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section — SEO + AI Indexing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t("faq.title")}</h2>
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
