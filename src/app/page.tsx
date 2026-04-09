import Link from "next/link";
import Image from "next/image";
import { JobCard } from "@/components/job-card";
import { AdBanner } from "@/components/ad-banner";

// 静态示例数据（快速部署模式）
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
    isFeatured: true,
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

export default function HomePage() {
  const featuredJobs = sampleJobs.filter((j) => j.isFeatured);
  const latestJobs = sampleJobs;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              招聘平台
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/jobs" className="text-gray-700 hover:text-blue-600">
                职位
              </Link>
              <Link href="/companies" className="text-gray-700 hover:text-blue-600">
                公司
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600">
                关于我们
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                发布职位
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              找到理想的工作
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              连接优秀人才与优质企业，让求职更简单
            </p>
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">100+</div>
                <div className="text-blue-200">活跃职位</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-blue-200">入驻企业</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Banner Ad */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdBanner position="HP_BANNER_01" />
      </section>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-6">精选职位</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">最新职位</h2>
          <Link
            href="/jobs"
            className="text-blue-600 hover:text-blue-800"
          >
            查看全部 →
          </Link>
        </div>
        <div className="space-y-4">
          {latestJobs.map((job) => (
            <JobCard key={job.id} job={job} compact />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">招聘平台</h3>
              <p className="text-gray-400">
                专业的求职招聘平台，连接优秀人才与优质企业。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">快速链接</h3>
              <ul className="space-y-2">
                <li><Link href="/jobs" className="text-gray-400 hover:text-white">职位搜索</Link></li>
                <li><Link href="/companies" className="text-gray-400 hover:text-white">公司列表</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">关于我们</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            © 2024 招聘平台. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
