import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { generateJobMetadata } from "@/lib/metadata";
import { generateJobPostingSchema, generateBreadcrumbSchema } from "@/lib/schema";
import { safeJsonLdStringify } from "@/lib/utils";
import JobDetailPageClient from "@/components/job-detail-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const job = await prisma.jobs.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
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
    job = await prisma.jobs.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: { companies: true },
    });
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

  const jobPostingSchema = generateJobPostingSchema(job, locale);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: isEn ? "Home" : "首页", url: `${SITE_URL}/${locale}` },
    { name: isEn ? "Jobs" : "职位", url: `${SITE_URL}/${locale}/jobs` },
    { name: job.title, url: `${SITE_URL}/${locale}/jobs/${job.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jobPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }} />
      <JobDetailPageClient job={job} locale={locale} />
    </>
  );
}
