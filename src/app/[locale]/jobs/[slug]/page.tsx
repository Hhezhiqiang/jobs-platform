import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { generateJobMetadata } from "@/lib/metadata";
import { generateJobPostingSchema } from "@/lib/schema";
import { safeJsonLdStringify } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const job = await prisma.jobs.findUnique({
    where: { slug },
    include: { companies: true },
  });
  if (!job) return { title: "职位未找到" };
  
  return generateJobMetadata(job, locale);
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const isEn = locale === "en";

  let job;
  try {
    job = await prisma.jobs.findUnique({
      where: { slug },
      include: { companies: true },
    });
  } catch {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{isEn ? "Database Error" : "数据库错误"}</h1>
          <p className="text-gray-600">{isEn ? "Unable to load job details. Please try again later." : "无法加载职位详情，请稍后重试。"}</p>
        </div>
      </div>
    );
  }

  if (!job) notFound();

  const salaryText = job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}K` : "薪资面议";
  const typeMap: Record<string, string> = {
    FULL_TIME: isEn ? "Full-time" : "全职",
    PART_TIME: isEn ? "Part-time" : "兼职",
    CONTRACT: isEn ? "Contract" : "合同工",
    INTERNSHIP: isEn ? "Internship" : "实习",
    FREELANCE: isEn ? "Freelance" : "自由职业",
  };

  const jobPostingSchema = generateJobPostingSchema(job);

  const cleanDescription = (job.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jobPostingSchema) }}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href={`/${locale}/jobs`} className="text-blue-600 hover:underline mb-4 inline-block">
            ← {isEn ? "Back to Jobs" : "返回职位列表"}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
          <p className="text-lg text-gray-600 mb-4">{job.companies?.name || "-"}</p>
          <div className="flex gap-4 mb-8">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{typeMap[job.employmentType] || job.employmentType}</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">{job.location || "-"}</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{salaryText}</span>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Description" : "职位描述"}</h2>
            <div className="prose max-w-none whitespace-pre-wrap">{cleanDescription || (isEn ? "No description available" : "暂无描述")}</div>
          </div>
          {job.requirements && (
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Requirements" : "任职要求"}</h2>
              <div className="prose max-w-none whitespace-pre-wrap">{job.requirements}</div>
            </div>
          )}
          {job.benefits && (
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Benefits" : "福利待遇"}</h2>
              <div className="prose max-w-none whitespace-pre-wrap">{job.benefits}</div>
            </div>
          )}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Company" : "公司信息"}</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                {(job.companies?.name || "?")[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{job.companies?.name || (isEn ? "Unknown Company" : "未知公司")}</p>
                {job.companies?.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{job.companies.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {job.applyUrl ? (
              job.slug?.startsWith('adzuna-') ? (
                <a 
                  href={`https://www.adzuna.com/jobs?q=${encodeURIComponent(job.title)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <span>{isEn ? "Search on Adzuna" : "去 Adzuna 搜索"}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              ) : (
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                  {isEn ? "Apply Now" : "立即申请"}
                </a>
              )
            ) : (
              <button disabled className="flex-1 bg-gray-300 text-gray-500 text-center py-3 rounded-xl font-semibold cursor-not-allowed">
                {isEn ? "No Application Link" : "暂无申请链接"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
