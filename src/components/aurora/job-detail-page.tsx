import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { generateJobMetadata } from "@/lib/metadata";
import { generateJobPostingSchema } from "@/lib/schema";
import { safeJsonLdStringify } from "@/lib/utils";
import { MapPin, Briefcase, Clock, DollarSign, Building2, ArrowLeft, ExternalLink, Share2, Heart } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const job = await prisma.jobs.findUnique({ where: { slug }, include: { companies: true } });
  if (!job) return { title: "职位未找到" };
  return generateJobMetadata(job, locale);
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const isEn = locale === "en";

  let job;
  try {
    job = await prisma.jobs.findUnique({ where: { slug }, include: { companies: true } });
  } catch {
    return (
      <div className="min-h-screen bg-[#f8f7fc] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">{isEn ? "Database Error" : "数据库错误"}</h1>
          <p className="text-gray-600">{isEn ? "Unable to load job details. Please try again later." : "无法加载职位详情，请稍后重试。"}</p>
        </div>
      </div>
    );
  }

  if (!job) notFound();

  const salaryText = job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}K` : isEn ? "Salary Negotiable" : "薪资面议";
  const typeMap: Record<string, string> = {
    FULL_TIME: isEn ? "Full-time" : "全职",
    PART_TIME: isEn ? "Part-time" : "兼职",
    CONTRACT: isEn ? "Contract" : "合同工",
    INTERNSHIP: isEn ? "Internship" : "实习",
    FREELANCE: isEn ? "Freelance" : "自由职业",
  };

  const jobPostingSchema = generateJobPostingSchema(job);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jobPostingSchema) }} />
      <div className="min-h-screen bg-[#f8f7fc]">
        {/* Aurora Header */}
        <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] py-8">
          <div className="max-w-5xl mx-auto px-4">
            <Link href={`/${locale}/jobs`} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {isEn ? "Back to Jobs" : "返回职位列表"}
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {job.companies?.name || "-"}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {job.location || "-"}
              </span>
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {salaryText}
              </span>
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {typeMap[job.employmentType] || job.employmentType}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {job.description && (
                <div className="aurora-card rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Description" : "职位描述"}</h2>
                  <div className="prose max-w-none whitespace-pre-wrap text-gray-700">{job.description}</div>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && (
                <div className="aurora-card rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Requirements" : "任职要求"}</h2>
                  <div className="prose max-w-none whitespace-pre-wrap text-gray-700">{job.requirements}</div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && (
                <div className="aurora-card rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Benefits" : "福利待遇"}</h2>
                  <div className="prose max-w-none whitespace-pre-wrap text-gray-700">{job.benefits}</div>
                </div>
              )}
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-6">
              {/* Apply Card */}
              <div className="aurora-card rounded-2xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{isEn ? "Apply Now" : "立即申请"}</h3>
                {job.applyUrl ? (
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all">
                    {isEn ? "Apply" : "申请职位"}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <div className="py-3 bg-gray-100 text-gray-500 rounded-xl text-center">{isEn ? "Apply via platform" : "通过平台申请"}</div>
                )}
                <div className="mt-4 flex gap-3">
                  <button className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4" />
                    {isEn ? "Save" : "收藏"}
                  </button>
                  <button className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />
                    {isEn ? "Share" : "分享"}
                  </button>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {isEn ? "Posted" : "发布于"} {new Date(job.datePosted || job.createdAt).toLocaleDateString(isEn ? "en-US" : "zh-CN")}
                  </div>
                </div>
              </div>

              {/* Company Info */}
              {job.companies && (
                <div className="aurora-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{isEn ? "Company" : "公司信息"}</h3>
                  <Link href={`/${locale}/companies/${job.companies.slug}`} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg">
                      {job.companies.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-[#4f46e5] transition-colors">{job.companies.name}</p>
                      <p className="text-sm text-gray-500">{job.companies.industry || isEn ? "Tech" : "互联网"}</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
