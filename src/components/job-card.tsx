import Link from "next/link";
import Image from "next/image";

// 灵活的职位类型（支持 Prisma 和静态数据）
interface JobData {
  id: string;
  slug: string;
  title: string;
  employmentType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  location: string;
  isRemote?: boolean;
  isHybrid?: boolean;
  datePosted: Date | string;
  imageUrl?: string | null;
  company: {
    name: string;
    logo?: string | null;
  };
}

interface JobCardProps {
  job: JobData;
  compact?: boolean;
}

export function JobCard({ job, compact = false }: JobCardProps) {
  const salaryText = job.salaryMin && job.salaryMax
    ? `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency || 'CNY'}`
    : "薪资面议";

  const dateStr = typeof job.datePosted === 'string' 
    ? job.datePosted 
    : job.datePosted.toLocaleDateString("zh-CN");

  if (compact) {
    return (
      <Link
        href={`/jobs/${job.slug}`}
        className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {job.company.logo && (
                <Image
                  src={job.company.logo}
                  alt={`${job.company.name} Logo`}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.company.name}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-blue-600">{salaryText}</p>
            <p className="text-sm text-gray-500">{job.location}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="block bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {job.imageUrl && (
        <div className="relative h-40 w-full">
          <Image
            src={job.imageUrl}
            alt={`${job.title} - 职位图片`}
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {job.company.logo && (
              <Image
                src={job.company.logo}
                alt={`${job.company.name} Logo`}
                width={50}
                height={50}
                className="rounded-lg object-cover"
                loading="lazy"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.company.name}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span>{job.location}</span>
          <span>·</span>
          <span>{job.employmentType}</span>
          {job.isRemote && (
            <>
              <span>·</span>
              <span className="text-green-600">远程</span>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="font-semibold text-blue-600">{salaryText}</span>
          <span className="text-sm text-gray-400">{dateStr}</span>
        </div>
      </div>
    </Link>
  );
}
