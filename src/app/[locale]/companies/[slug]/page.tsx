import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { generateCompanyMetadata } from "@/lib/metadata";
import { generateOrganizationSchema } from "@/lib/schema";
import { JobCardV2 } from "@/components/job-card-v2";
import { Metadata } from "next";
import { MapPin, Globe, Users, Building2, Briefcase, ChevronRight } from "lucide-react";
import { safeJsonLdStringify, ensureHttpProtocol } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
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
  const { slug, locale } = await params;
  try {
    const company = await prisma.companies.findUnique({
      where: { slug },
    });

    if (!company) {
      return { title: locale === "en" ? "Company Not Found" : "公司未找到" };
    }

    return generateCompanyMetadata(company, locale);
  } catch {
    return { title: locale === "en" ? "Company Not Found" : "公司未找到" };
  }
}

async function getCompanyData(slug: string) {
  try {
    const company = await prisma.companies.findUnique({
      where: { slug },
      include: {
        jobs: {
          where: { status: "ACTIVE" },
          orderBy: { datePosted: "desc" },
          include: {
            companies: true,
          },
        },
      },
    });
    return company;
  } catch {
    return null;
  }
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const isEn = locale === "en";
  const company = await getCompanyData(slug);

  if (!company) {
    notFound();
  }

  const orgSchema = generateOrganizationSchema(company);
  const validJobs = company.jobs.filter(job => job.slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(orgSchema) }} />

      <div className="min-h-screen bg-gray-50">

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-800">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-blue-100 mb-6">
              <Link href={`/${locale}/`} className="hover:text-white">{isEn ? "Home" : "首页"}</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href={`/${locale}/companies`} className="hover:text-white">{isEn ? "Companies" : "公司"}</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white">{company.name}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {company.logo ? (
                <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
                  <Image
                    src={company.logo}
                    alt={company.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center text-3xl font-bold text-blue-600 shadow-2xl">
                  {company.name.charAt(0)}
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{company.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-blue-100">
                  {company.industry && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {company.industry}
                    </span>
                  )}
                  {company.size && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {company.size}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {company.jobs.length} {isEn ? "open positions" : "个在招职位"}
                  </span>
                </div>
              </div>

              {company.website && (
                <Link
                  href={ensureHttpProtocol(company.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
                >
                  <Globe className="w-5 h-5" />
                  访问官网
                </Link>
              )}
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Company Description */}
              {company.description && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Company Profile" : "公司简介"}</h2>
                  <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {company.description}
                  </div>
                </div>
              )}

              {/* Job Listings */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{isEn ? "Open Positions" : "在招职位"}</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {validJobs.length} 个职位
                  </span>
                </div>

                {validJobs.length > 0 ? (
                  <div className="space-y-4">
                    {validJobs.map((job) => (
                      <JobCardV2 key={job.id} job={job} variant="compact" locale={locale} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{isEn ? "No open positions" : "暂无在招职位"}</h3>
                    <p className="text-gray-500">{isEn ? "No open positions yet" : "该企业暂时没有发布职位"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Company Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-6">{isEn ? "Company Info" : "公司信息"}</h3>
                
                <div className="space-y-4">
                  {company.location && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{isEn ? "Address" : "公司地址"}</p>
                        <p className="font-medium text-gray-900">{company.location}</p>
                      </div>
                    </div>
                  )}

                  {company.size && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{isEn ? "Company Size" : "公司规模"}</p>
                        <p className="font-medium text-gray-900">{company.size}</p>
                      </div>
                    </div>
                  )}

                  {company.industry && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{isEn ? "Industry" : "所属行业"}</p>
                        <p className="font-medium text-gray-900">{company.industry}</p>
                      </div>
                    </div>
                  )}

                  {company.website && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{isEn ? "Website" : "官方网站"}</p>
                        <Link
                          href={ensureHttpProtocol(company.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          访问官网
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
