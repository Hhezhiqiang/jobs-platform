import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
  return { title: `${job.title} - ${job.companies.name} | JobQuip` };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const isEn = locale === "en";

  let job: any;
  try {
    job = await prisma.jobs.findUnique({
      where: { slug },
      include: { companies: true },
    });
  } catch (e: any) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">数据库错误</h1>
          <pre className="text-sm bg-red-50 p-4 rounded-lg text-left max-w-2xl overflow-auto">
            {e.message}
            {"\n\n"}Stack: {e.stack}
          </pre>
        </div>
      </div>
    );
  }

  if (!job) notFound();

  try {
    const t = await getTranslations({ locale, namespace: "jobDetail" });
    const salaryText = job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}K` : "薪资面议";
    const typeMap: Record<string, string> = {
      FULL_TIME: isEn ? "Full-time" : "全职",
      PART_TIME: isEn ? "Part-time" : "兼职",
      CONTRACT: isEn ? "Contract" : "合同工",
      INTERNSHIP: isEn ? "Internship" : "实习",
      FREELANCE: isEn ? "Freelance" : "自由职业",
    };

    return (
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
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Description" : "职位描述"}</h2>
            <div className="prose max-w-none whitespace-pre-wrap">{job.description || "暂无描述"}</div>
          </div>
        </div>
      </div>
    );
  } catch (e: any) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">页面渲染错误</h1>
          <pre className="text-sm bg-red-50 p-4 rounded-lg text-left max-w-2xl overflow-auto">
            {e.message}
            {"\n\n"}Stack: {e.stack}
          </pre>
        </div>
      </div>
    );
  }
}
