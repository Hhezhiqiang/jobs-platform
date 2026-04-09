import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { generateJobMetadata } from "@/lib/metadata";
import { generateJobPostingSchema, generateBreadcrumbSchema } from "@/lib/schema";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 静态职位数据
const sampleJobs: Record<string, any> = {
  "senior-frontend-engineer": {
    id: "1",
    slug: "senior-frontend-engineer",
    title: "高级前端工程师",
    description: "负责公司核心产品的前端开发工作，包括：\n\n1. 负责前端架构设计和技术选型\n2. 开发高性能、可复用的前端组件\n3. 优化前端性能，提升用户体验\n4. 参与产品需求讨论，提供技术方案",
    requirements: "1. 3年以上前端开发经验\n2. 精通 React/Vue 等前端框架\n3. 熟悉 TypeScript\n4. 了解前端工程化和性能优化",
    benefits: "五险一金、带薪年假、弹性工作、年度体检、团建活动",
    employmentType: "FULL_TIME",
    experience: "SENIOR",
    salaryMin: 25000,
    salaryMax: 40000,
    salaryCurrency: "CNY",
    salaryPeriod: "YEAR",
    location: "北京市朝阳区建国路88号",
    city: "北京",
    country: "CN",
    isRemote: false,
    isHybrid: true,
    applyUrl: "https://example.com/apply",
    status: "ACTIVE",
    datePosted: new Date("2024-01-15"),
    validThrough: new Date("2024-04-15"),
    updatedAt: new Date(),
    imageUrl: null,
    company: {
      id: "1",
      name: "科技有限公司",
      slug: "tech-corp",
      logo: null,
      website: "https://example.com",
      description: "一家专注于技术创新的互联网公司",
      industry: "互联网",
      size: "100-500人",
      location: "北京市朝阳区",
    },
  },
  "backend-engineer": {
    id: "2",
    slug: "backend-engineer",
    title: "后端开发工程师",
    description: "负责服务端架构设计和开发，包括：\n\n1. 设计和开发高并发、高可用的后端服务\n2. 数据库设计和优化\n3. API 接口设计和开发\n4. 系统性能优化和监控",
    requirements: "1. 2年以上后端开发经验\n2. 熟悉 Java/Go/Node.js 等语言\n3. 熟悉 MySQL/PostgreSQL/MongoDB\n4. 了解微服务架构",
    benefits: "五险一金、带薪年假、弹性工作、技术分享会",
    employmentType: "FULL_TIME",
    experience: "MID",
    salaryMin: 20000,
    salaryMax: 35000,
    salaryCurrency: "CNY",
    salaryPeriod: "YEAR",
    location: "上海市浦东新区陆家嘴",
    city: "上海",
    country: "CN",
    isRemote: false,
    isHybrid: false,
    applyUrl: "https://example.com/apply2",
    status: "ACTIVE",
    datePosted: new Date("2024-01-10"),
    validThrough: new Date("2024-04-10"),
    updatedAt: new Date(),
    imageUrl: null,
    company: {
      id: "2",
      name: "创新科技",
      slug: "innovation-tech",
      logo: null,
      website: null,
      description: "领先的互联网技术公司",
      industry: "互联网",
      size: "50-100人",
      location: "上海市浦东新区",
    },
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = sampleJobs[slug];

  if (!job) {
    return { title: "职位未找到" };
  }

  return generateJobMetadata(job);
}

// 静态生成所有职位页面
export function generateStaticParams() {
  return Object.keys(sampleJobs).map((slug) => ({ slug }));
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = sampleJobs[slug];

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
                  <p className="font-semibold">{job.employmentType}</p>
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
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  立即申请
                </a>
              </div>

              <p className="text-sm text-gray-500 mt-4 text-center">
                点击申请将跳转到外部页面
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  );
}
