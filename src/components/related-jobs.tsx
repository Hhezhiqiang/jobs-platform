import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MapPin, DollarSign, Briefcase, ArrowRight } from "lucide-react";

interface RelatedJobsProps {
  keywords?: string[];
  currentSlug: string;
  limit?: number;
}

export async function RelatedJobs({ keywords = [], currentSlug, limit = 3 }: RelatedJobsProps) {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  // 根据博客关键词匹配相关职位
  const jobs = await prisma.jobs.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { title: { contains: keywords[0], mode: "insensitive" } },
        { keywords: { hasSome: keywords.slice(0, 3) } },
        { description: { contains: keywords[0], mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      companies: {
        select: {
          name: true,
          logo: true,
        },
      },
      city: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      isRemote: true,
      isHybrid: true,
    },
  });

  if (jobs.length === 0) {
    // 如果没有匹配的，返回最新职位
    const fallbackJobs = await prisma.jobs.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        companies: {
          select: {
            name: true,
            logo: true,
          },
        },
        city: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        isRemote: true,
        isHybrid: true,
      },
    });

    if (fallbackJobs.length === 0) return null;

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            最新热招职位
          </h3>
          <Link
            href="/jobs"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            查看更多
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {fallbackJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          相关职位推荐
        </h3>
        <Link
          href={`/jobs?keyword=${encodeURIComponent(keywords[0])}`}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          查看更多
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        根据本文内容为您推荐的相关职位
      </p>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  const formatSalary = () => {
    if (!job.salaryMin || !job.salaryMax) return "薪资面议";
    const currency = job.salaryCurrency === "USD" ? "$" : "¥";
    return `${currency}${job.salaryMin}k-${job.salaryMax}k`;
  };

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {job.title}
          </h4>
          <p className="text-sm text-gray-500 mt-1">{job.companies?.name || "未知公司"}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.city || "远程"}
            </span>
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              {formatSalary()}
            </span>
            {(job.isRemote || job.isHybrid) && (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {job.isRemote ? "远程" : job.isHybrid ? "混合" : " onsite"}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </Link>
  );
}
