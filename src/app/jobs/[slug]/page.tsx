import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { generateJobMetadata } from "@/lib/metadata";
import { generateJobPostingSchema, generateBreadcrumbSchema } from "@/lib/schema";
import { Header } from "@/components/header";
import { ApplyButton } from "@/components/apply-button";
import { Metadata } from "next";
import { MapPin, Briefcase, DollarSign, Clock, Building2, Share2, Heart, Calendar } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

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

  const jobSchema = generateJobPostingSchema(job);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "首页", url: "/" },
    { name: "职位", url: "/jobs" },
    { name: job.title, url: `/jobs/${job.slug}` },
  ]);

  const salaryText = job.salaryMin && job.salaryMax
    ? `${job.salaryMin}-${job.salaryMax}K`
    : "薪资面议";

  const timeAgo = formatDistanceToNow(job.datePosted);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-gray-50">
        <Header />

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-400/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-blue-100 mb-6">
              <Link href="/" className="hover:text-white">首页</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/jobs" className="hover:text-white">职位</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white">{job.title}</span>
            </div>

            {/* Job Title & Company */}
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-blue-100">
                  <Link 
                    href={`/companies/${job.company.slug}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    {job.company.name}
                  </Link>
                  <span>·</span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span>·</span>
                  <span>⏱️ {timeAgo}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <DollarSign className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-500">薪资范围</p>
                  <p className="font-bold text-gray-900">{salaryText}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <Briefcase className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-sm text-gray-500">职位类型</p>
                  <p className="font-bold text-gray-900">{employmentTypeMap[job.employmentType] || job.employmentType}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <MapPin className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="text-sm text-gray-500">工作地点</p>
                  <p className="font-bold text-gray-900">{job.location}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <Calendar className="w-5 h-5 text-orange-600 mb-2" />
                  <p className="text-sm text-gray-500">发布日期</p>
                  <p className="font-bold text-gray-900">{new Date(job.datePosted).toLocaleDateString("zh-CN")}</p>
                </div>
              </div>

              {/* Job Description */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">职位描述</h2>
                  <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </div>
                </div>

                {job.requirements && (
                  <>
                    <hr className="border-gray-100" />
                    <div className="p-6 md:p-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">任职要求</h2>
                      <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {job.requirements}
                      </div>
                    </div>
                  </>
                )}

                {job.benefits && (
                  <>
                    <hr className="border-gray-100" />
                    <div className="p-6 md:p-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">福利待遇</h2>
                      <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {job.benefits}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <ApplyButton
                  jobId={job.id}
                  jobTitle={job.title}
                  companyName={job.company.name}
                  applyUrl={job.applyUrl}
                />

                <p className="text-sm text-gray-500 text-center mt-4">
                  申请后，HR将在3-5个工作日内回复
                </p>
              </div>

              {/* Company Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">关于公司</h3>
                <div className="flex items-center gap-4 mb-4">
                  {job.company.logo ? (
                    <Image
                      src={job.company.logo}
                      alt={job.company.name}
                      width={60}
                      height={60}
                      className="rounded-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                      {job.company.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <Link 
                      href={`/companies/${job.company.slug}`}
                      className="font-bold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {job.company.name}
                    </Link>
                    <p className="text-sm text-gray-500">{job.company.industry}</p>
                  </div>
                </div>

                {job.company.description && (
                  <p className="text-gray-600 text-sm line-clamp-4 mb-4">
                    {job.company.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {job.company.size && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      {job.company.size}
                    </div>
                  )}
                  {job.company.website && (
                    <Link 
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      访问官网
                    </Link>
                  )}
                </div>

                <Link
                  href={`/companies/${job.company.slug}`}
                  className="mt-4 block w-full py-2.5 text-center border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  查看公司主页
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
