import Link from "next/link";
import { generateJobsListMetadata } from "@/lib/metadata";
import { JobCard } from "@/components/job-card";
import { Metadata } from "next";

interface PageProps {
  searchParams: Promise<{
    city?: string;
    type?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  return generateJobsListMetadata({
    city: params.city,
    type: params.type,
  });
}

// 静态示例数据
const sampleJobs = [
  {
    id: "1",
    slug: "senior-frontend-engineer",
    title: "高级前端工程师",
    description: "负责公司核心产品的前端开发工作...",
    employmentType: "FULL_TIME" as const,
    experience: "SENIOR" as const,
    salaryMin: 25000,
    salaryMax: 40000,
    salaryCurrency: "CNY",
    salaryPeriod: "YEAR",
    location: "北京市朝阳区",
    city: "北京",
    country: "CN",
    isRemote: false,
    isHybrid: true,
    applyUrl: "#",
    status: "ACTIVE" as const,
    isFeatured: true,
    viewCount: 100,
    datePosted: new Date(),
    validThrough: null,
    metaTitle: null,
    metaDescription: null,
    keywords: [],
    imageUrl: null,
    schemaOrganizationName: null,
    schemaOrganizationLogo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    companyId: "1",
    authorId: "1",
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
      createdAt: new Date(),
      updatedAt: new Date(),
      metaTitle: null,
      metaDescription: null,
    },
  },
  {
    id: "2",
    slug: "backend-engineer",
    title: "后端开发工程师",
    description: "负责服务端架构设计和开发...",
    employmentType: "FULL_TIME" as const,
    experience: "MID" as const,
    salaryMin: 20000,
    salaryMax: 35000,
    salaryCurrency: "CNY",
    salaryPeriod: "YEAR",
    location: "上海市浦东新区",
    city: "上海",
    country: "CN",
    isRemote: false,
    isHybrid: false,
    applyUrl: "#",
    status: "ACTIVE" as const,
    isFeatured: false,
    viewCount: 80,
    datePosted: new Date(),
    validThrough: null,
    metaTitle: null,
    metaDescription: null,
    keywords: [],
    imageUrl: null,
    schemaOrganizationName: null,
    schemaOrganizationLogo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    companyId: "2",
    authorId: "1",
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
      createdAt: new Date(),
      updatedAt: new Date(),
      metaTitle: null,
      metaDescription: null,
    },
  },
];

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  
  // 静态数据，不分页
  const jobs = sampleJobs;
  const total = jobs.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← 首页
            </Link>
            <h1 className="text-2xl font-bold">职位列表</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-600 mb-6">
          共找到 {total} 个职位
        </p>

        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} compact />
          ))}
        </div>

        {/* 分页占位 */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <span className="px-4 py-2">{page} / 1</span>
          </div>
        )}
      </main>
    </div>
  );
}
