import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import { prisma } from "@/lib/prisma";
import { Building2, Search, ChevronRight } from "lucide-react";
import { Metadata } from "next";
import { safeJsonLdStringify } from "@/lib/utils";
import { AuroraCompanyCard } from "@/components/aurora/company-card";
export const revalidate = 3600;

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "JobQuip";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const sp = await searchParams;
  const query = sp.q || "";
  const title = query
    ? (isEn ? `${query} Companies - Search Results` : `${query} 相关公司 - 企业搜索`)
    : (isEn ? "Company Directory - Discover Great Companies" : "知名企业列表 - 发现优秀企业");
  const description = query
    ? (isEn ? `Search results for "${query}", view latest company info and details.` : `搜索"${query}"找到的相关企业，查看最新招聘信息和公司详情。`)
    : (isEn ? "Discover excellent companies, explore top internet companies, and find your ideal platform." : "发现优秀企业，探索知名互联网公司，找到理想的职业平台。查看最新公司列表和招聘信息。");

  return {
    title,
    description,
    keywords: isEn ? ["company directory", "companies", "tech companies", query].filter(Boolean) : ["公司列表", "企业招聘", "互联网公司", query, "公司详情"].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/companies`,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/companies`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/companies`,
        "en": `${SITE_URL}/en/companies`,
        "x-default": `${SITE_URL}/zh/companies`,
      },
    },
  };
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function CompaniesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const isEn = locale === "en";
  const sp = await searchParams;
  const searchQuery = sp.q || "";

  // 从数据库获取真实公司数据
  const companies = await prisma.companies.findMany({
    where: searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { industry: { contains: searchQuery, mode: "insensitive" } },
            { location: { contains: searchQuery, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: { jobs: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Organization Schema for each company
  const organizationSchemas = companies.map((company) => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: `${SITE_URL}/companies/${company.slug}`,
    description: company.description || `${company.name} - 在${company.industry || '互联网'}行业的招聘企业`,
    ...(company.location && { address: { "@type": "PostalAddress", addressLocality: company.location } }),
    ...(company.logo && { logo: company.logo }),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${company.name} 招聘职位`,
      url: `${SITE_URL}/companies/${company.slug}`,
    },
  }));

  return (
    <>
      {organizationSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(schema) }}
        />
      ))}
      <div className="min-h-screen bg-[#f8f7fc]">

      {/* Aurora Hero Section */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-sm mb-6 border border-white/10">
              <Building2 className="w-4 h-4 text-[#a5b4fc]" />
              <span className="font-medium">{companies.length} 家优质企业</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              发现
              <span className="bg-gradient-to-r from-[#a5b4fc] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent"> 优秀企业</span>
            </h1>
            <p className="text-[#c7d2fe]/80 mb-8 text-lg">{isEn ? "Explore top internet companies, find your ideal platform" : "探索知名互联网公司，找到理想的职业平台"}</p>

            {/* Search */}
            <form action="/companies" className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder={isEn ? "Search company name, industry or city..." : "搜索公司名称、行业或城市..."}
                  aria-label={isEn ? "Search companies" : "搜索公司"}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition-all"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb items={[{ label: "公司列表", href: `/${locale}/companies` }]} />
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              找到 <span className="font-semibold">{companies.length}</span> 家公司
              匹配 &quot;<span className="font-semibold">{searchQuery}</span>&quot;
            </p>
            <Link href={`/${locale}/companies`} className="text-blue-600 hover:text-blue-700 text-sm">
              清除搜索
            </Link>
          </div>
        )}

        {/* Companies Grid */}
        {companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <AuroraCompanyCard key={company.id} company={company as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-[#eef2ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-[#6366f1]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{isEn ? "No Companies Found" : "未找到公司"}</h3>
            <p className="text-gray-500 mb-6">{isEn ? "Try different keywords" : "尝试使用其他关键词搜索"}</p>
            <Link
              href={`/${locale}/companies`}
              className="px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-medium hover:shadow-lg transition-all inline-block"
            >
              查看全部公司
            </Link>
          </div>
        )}
      </main>
    </div>
    </>
  );
}
