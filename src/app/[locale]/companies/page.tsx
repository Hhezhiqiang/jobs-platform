import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import { prisma } from "@/lib/prisma";
import { Building2, MapPin, Users, Briefcase, Search } from "lucide-react";
import { Metadata } from "next";
import { safeJsonLdStringify } from "@/lib/utils";
export const revalidate = 3600;

const SITE_NAME = "JobQuip招聘平台";
const SITE_URL = "https://jobquip.com";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || "";
  const title = query
    ? `${query} 相关公司 - 企业搜索 | ${SITE_NAME}`
    : `知名企业列表 - 发现优秀企业 | ${SITE_NAME}`;
  const description = query
    ? `搜索"${query}"找到的相关企业，查看最新招聘信息和公司详情。`
    : "发现优秀企业，探索知名互联网公司，找到理想的职业平台。查看最新公司列表和招聘信息。";

  return {
    title,
    description,
    keywords: ["公司列表", "企业招聘", "互联网公司", query, "公司详情"].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/companies`,
      siteName: SITE_NAME,
      type: "website",
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/companies`,
    },
  };
}

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.q || "";

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
      <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-4">
              <Building2 className="w-4 h-4" />
              {companies.length} 家优质企业
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">发现优秀企业</h1>
            <p className="text-blue-100 mb-6">探索知名互联网公司，找到理想的职业平台</p>

            {/* Search */}
            <form action="/companies" className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="搜索公司名称、行业或城市..."
                  aria-label="搜索公司"
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb items={[{ label: "公司列表", href: "/companies" }]} />
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              找到 <span className="font-semibold">{companies.length}</span> 家公司
              匹配 &quot;<span className="font-semibold">{searchQuery}</span>&quot;
            </p>
            <Link href="/companies" className="text-blue-600 hover:text-blue-700 text-sm">
              清除搜索
            </Link>
          </div>
        )}

        {/* Companies Grid */}
        {companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.slug}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {company.logo ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
                        <Image
                          src={company.logo}
                          alt={`${company.name} 公司Logo`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                        {company.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {company.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 truncate">{company.industry || "互联网"}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                      {company.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {company.location}
                        </span>
                      )}
                      {company.size && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {company.size}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium">
                        <Briefcase className="w-4 h-4" />
                        {company._count.jobs} 个职位
                      </span>
                      <span className="text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        查看详情 →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">未找到公司</h3>
            <p className="text-gray-500 mb-6">尝试使用其他关键词搜索</p>
            <Link
              href="/companies"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all inline-block"
            >
              查看全部公司
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
// trigger redeploy Sat Apr 18 09:51:01 PM CST 2026
