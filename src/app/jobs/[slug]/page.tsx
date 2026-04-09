import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { generateJobMetadata } from "@/lib/metadata";
import { generateJobPostingSchema, generateBreadcrumbSchema } from "@/lib/schema";
import { Metadata } from "next";
import { ApplyButton } from "@/components/apply-button";

// 职位类型中文映射
const employmentTypeMap: Record<string, string> = {
  FULL_TIME: "全职",
  PART_TIME: "兼职",
  CONTRACT: "合同工",
  INTERNSHIP: "实习",
  FREELANCE: "自由职业",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    include: { company: true },
  });

  if (!job) {
    return { title: "职位未找到" };
  }

  return generateJobMetadata(job);
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    include: { company: true },
  });

  if (!job) {
    notFound();
  }

  // 生成 JobPosting Schema
  const jobSchema = generateJobPostingSchema(job);
  
  // 生成面包屑 Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "首页", url: "/" },
    { name: "职位", url: "/jobs" },
    { name: job.title, url: `/jobs/${job.slug}` },
  ]);

  const salaryText = job.salaryMin && job.salaryMax
    ? `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency}/${job.salaryPeriod === "YEAR" ? "年" : "月"}`
    : "薪资面议";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jobSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← 返回首页
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* AI 友好的职位摘要 */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
            <p className="text-gray-800 leading-relaxed">
              <strong>📋 职位速览：</strong>
              {job.company.name} 招聘 {job.title}，
              {job.salaryMin ? `年薪 ${job.salaryMin.toLocaleString()}-${job.salaryMax?.toLocaleString()} ${job.salaryCurrency}，` : "薪资面议，"}
              工作地点 {job.location}，
              {employmentTypeMap[job.employmentType] || "其他"} 岗位。
              欢迎符合条件的候选人投递简历！
            </p>
          </div>

          <article className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* 职位图片 */}
            {job.imageUrl && (
              <div className="relative h-64 w-full">
                <Image
                  src={job.imageUrl}
                  alt={`${job.title} - 职位图片`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div className="p-8">
              {/* 职位标题 */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>

              {/* 公司信息 */}
              <div className="flex items-center gap-4 mb-6">
                {job.company.logo && (
                  <Image
                    src={job.company.logo}
                    alt={`${job.company.name} Logo`}
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                )}
                <div>
                  <Link
                    href={`/companies/${job.company.slug}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {job.company.name}
                  </Link>
                  <p className="text-gray-600">{job.company.industry}</p>
                </div>
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">工作地点</p>
                  <p className="font-semibold">{job.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">职位类型</p>
                  <p className="font-semibold">{employmentTypeMap[job.employmentType] || job.employmentType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">薪资范围</p>
                  <p className="font-semibold text-blue-600">{salaryText}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">发布日期</p>
                  <p className="font-semibold">
                    {new Date(job.datePosted).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>

              {/* 职位描述 */}
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">职位描述</h2>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                  {job.description}
                </div>
              </section>

              {/* 任职要求 */}
              {job.requirements && (
                <section className="mb-8">
                  <h2 className="text-xl font-bold mb-4">任职要求</h2>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {job.requirements}
                  </div>
                </section>
              )}

              {/* 福利待遇 */}
              {job.benefits && (
                <section className="mb-8">
                  <h2 className="text-xl font-bold mb-4">福利待遇</h2>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {job.benefits}
                  </div>
                </section>
              )}

              {/* 申请按钮 */}
              <div className="flex gap-4 mt-8">
                <ApplyButton
                  jobId={job.id}
                  jobTitle={job.title}
                  companyName={job.company.name}
                  applyUrl={job.applyUrl}
                />
              </div>
            </div>
          </article>
        </main>
      </div>
    </>
  );
}
