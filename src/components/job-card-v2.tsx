import Link from "next/link";
import Image from "next/image";
import { Job, Company } from "@prisma/client";
import { formatDistanceToNow, formatSalary } from "@/lib/utils";
import { HeartButton } from "./heart-button";
import { HighlightedText } from "./highlighted-text";

interface JobCardV2Props {
  job: Job & { company: Company };
  variant?: "default" | "compact" | "featured";
  showFavorite?: boolean;
  highlightQuery?: string;
}

export function JobCardV2({ job, variant = "default", showFavorite = true, highlightQuery }: JobCardV2Props) {
  const salaryText = formatSalary(job.salaryMin, job.salaryMax);
  const timeAgo = formatDistanceToNow(job.datePosted);

  if (variant === "compact") {
    return (
      <Link
        href={`/jobs/${job.slug}`}
        className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
      >
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {job.company.logo ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
              <Image
                src={job.company.logo}
                alt={`${job.company.name} 公司Logo`}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {job.company.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {highlightQuery ? (
              <HighlightedText text={job.title} highlight={highlightQuery} />
            ) : (
              job.title
            )}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {highlightQuery ? (
              <HighlightedText text={job.company.name} highlight={highlightQuery} />
            ) : (
              job.company.name
            )}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              📍 {highlightQuery ? (
                <HighlightedText text={job.location} highlight={highlightQuery} />
              ) : (
                job.location
              )}
            </span>
            <span>·</span>
            <span>{job.employmentType}</span>
          </div>
        </div>

        {/* Salary & Time */}
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-blue-600">{salaryText}</p>
          <p className="text-xs text-gray-400">{timeAgo}</p>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        href={`/jobs/${job.slug}`}
        className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      >
        {/* Featured Badge */}
        <div className="relative">
          {job.imageUrl ? (
            <div className="h-40 relative overflow-hidden">
              <Image
                src={job.imageUrl}
                alt={`${job.title} 职位图片`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
              </div>
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
              🔥 热招
            </span>
          </div>
        </div>

        <div className="p-5">
          {/* Company */}
          <div className="flex items-center gap-3 mb-3">
            {job.company.logo ? (
              <Image
                src={job.company.logo}
                alt={`${job.company.name} 公司Logo`}
                width={40}
                height={40}
                className="rounded-lg"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {job.company.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{job.company.name}</p>
              <p className="text-xs text-gray-500">{job.company.industry || "互联网"}</p>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
              {job.location}
            </span>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
              {job.employmentType}
            </span>
            {job.isRemote && (
              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-lg">
                远程
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xl font-bold text-blue-600">{salaryText}</span>
            <span className="text-sm text-gray-400">{timeAgo}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <div className="group block bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative">
      {/* Favorite Button */}
      {showFavorite && (
        <div className="absolute top-4 right-4 z-10">
          <HeartButton jobId={job.id} size="sm" />
        </div>
      )}
      <Link href={`/jobs/${job.slug}`}>
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            {job.company.logo ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
                <Image
                  src={job.company.logo}
                  alt={`${job.company.name} 公司Logo`}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {job.company.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className={showFavorite ? "pr-12" : ""}>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>
                <p className="text-gray-600">{job.company.name}</p>
              </div>
              <span className="text-lg font-bold text-blue-600 flex-shrink-0">{salaryText}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-lg">
                📍 {job.location}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-lg">
                💼 {job.employmentType}
              </span>
              {job.isRemote && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 text-sm rounded-lg">
                  🏠 远程办公
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>⏱️ {timeAgo}</span>
                {job.isFeatured && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">
                    热招
                  </span>
                )}
              </div>
              <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                查看详情 →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
