import Link from "next/link";
import Image from "next/image";
import { getHomePageData } from "@/lib/optimized-queries";
import { generateHomeMetadata } from "@/lib/metadata";
import { generateFAQSchema } from "@/lib/schema";
import { safeJsonLdStringify } from "@/lib/utils";
import { Metadata } from "next";
import { HeroSection } from "@/components/aurora/hero-section";
import { AuroraStatsSection as StatsSection } from "@/components/aurora/stats-section";
import { FeaturesSection } from "@/components/features-section";
import { JobCardV2 } from "@/components/aurora/job-card";
import { HomeCheckinWrapper } from "@/components/game/home-checkin-wrapper";
import { KeywordCloud } from "@/components/aurora/keyword-cloud";
import { HomeCTA } from "@/components/home-cta";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateHomeMetadata(locale);
}

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
  
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  // Fetch ONLY featured jobs.
  // Note: If getHomePageData returns "latestJobs", we will IGNORE them here.
  const { featuredJobs, hotCompanies, stats } = await getHomePageData();
  const homeFAQ = await getHomeFAQ(locale);

  const displayStats = {
    jobCount: Math.max(stats.jobCount, 1),
    companyCount: Math.max(stats.companyCount, 1),
    dailyNewJobs: Math.max(stats.dailyNewJobs, 0),
  };

  return (
    <div className="min-h-screen bg-white">
      <HomeCheckinWrapper />

      {/* 1. Hero Section */}
      <HeroSection jobCount={displayStats.jobCount} companyCount={displayStats.companyCount} />
      
      {/* 2. Stats Section */}
      <StatsSection jobCount={displayStats.jobCount} companyCount={displayStats.companyCount} dailyNewJobs={displayStats.dailyNewJobs} />

      {/* 3. Hot Jobs Section (The ONLY job section on homepage) */}
      {featuredJobs.length > 0 && (
        <section className="py-12 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t("hotJobs")}</h2>
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
                <JobCardV2 key={job.id} job={job} variant="featured" locale={locale} />
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link
                href={`/${locale}/jobs`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
              >
                {t("viewAllJobs")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4. Features Section */}
      <FeaturesSection />

      {/* 6. Blog Section */}
      {stats.blogCount > 0 && (
        <section className="py-12 md:py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t("blogSection")}</h2>
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

      {/* 7. Keyword Cloud */}
      {stats.blogCount > 0 && (
        <KeywordCloud locale={locale} />
      )}

      {/* 8. Dynamic CTA Section (Login Aware) */}
      <HomeCTA isLoggedIn={isLoggedIn} />

      {/* 9. FAQ Section */}
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdStringify(generateFAQSchema(homeFAQ)),
        }}
      />
    </div>
  );
}
