import { Metadata } from "next";
import Link from "next/link";
import { Search, Briefcase, ArrowLeft } from "lucide-react";

const SITE_NAME = "JobQuip";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Job Demands - Latest Opportunities" : "求职需求 - 最新发布",
    description: isEn ? "Browse the latest job demands and opportunities posted by companies." : "浏览企业发布的最新求职需求和机会。",
    alternates: {
      canonical: `${SITE_URL}/${locale}/job-demands`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/job-demands`,
        "en": `${SITE_URL}/en/job-demands`,
      },
    },
  };
}

export const revalidate = 3600;

export default async function JobDemandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Link href={`/${locale}`} className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {isEn ? "Job Demands" : "求职需求"}
            </h1>
          </div>
          <p className="text-[#c7d2fe]/80 text-lg">
            {isEn 
              ? "Discover the latest job requirements posted by top companies." 
              : "发现顶尖企业发布的最新求职需求。"}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#eef2ff] rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-[#6366f1]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isEn ? "Job Demands Feature Coming Soon" : "求职需求功能即将上线"}
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {isEn 
              ? "We are currently collecting the latest job demands from enterprises. Stay tuned for updates!" 
              : "我们正在收集企业的最新求职需求，功能即将完善，敬请期待！"}
          </p>
          <Link 
            href={`/${locale}/jobs`} 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Briefcase className="w-5 h-5" />
            {isEn ? "Browse Jobs Instead" : "先去浏览职位"}
          </Link>
        </div>
      </main>
    </div>
  );
}