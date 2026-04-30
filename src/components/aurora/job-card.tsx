import Link from "next/link";
import Image from "next/image";
import { jobs, companies } from "@prisma/client";
import { formatDistanceToNow, formatSalary } from "@/lib/utils";
import { HeartButton } from "@/components/heart-button";
import { HighlightedText } from "@/components/highlighted-text";
import { MapPin, Briefcase, Clock, ArrowRight, Sparkles, Building2 } from "lucide-react";

interface JobCardV2Props {
  job: jobs & { companies: companies };
  variant?: "default" | "compact" | "featured";
  showFavorite?: boolean;
  highlightQuery?: string;
  locale?: string;
}

function getI18n(locale?: string) {
  const isEn = locale === "en";
  const t: Record<string, string> = isEn
    ? { fullTime: "Full-time", partTime: "Part-time", contract: "Contract", internship: "Internship", freelance: "Freelance", remote: "Remote", remoteOffice: "Remote", hot: "Hot", viewDetail: "View Details" }
    : { fullTime: "全职", partTime: "兼职", contract: "合同", internship: "实习", freelance: "自由职业", remote: "远程", remoteOffice: "远程办公", hot: "热招", viewDetail: "查看详情" };
  return { isEn, t };
}

export function JobCardV2({ job, variant = "default", showFavorite = true, highlightQuery, locale }: JobCardV2Props) {
  const { isEn, t } = getI18n(locale);
  const salaryText = formatSalary(job.salaryMin, job.salaryMax);
  const timeAgo = formatDistanceToNow(job.datePosted);

  const typeMap: Record<string, string> = {
    FULL_TIME: t.fullTime,
    PART_TIME: t.partTime,
    CONTRACT: t.contract,
    INTERNSHIP: t.internship,
    FREELANCE: t.freelance,
  };
  const displayType = typeMap[job.employmentType] || job.employmentType;

  // 安全路由
  const jobLink = job.slug 
    ? `/${locale}/jobs/${job.slug}` 
    : `/${locale}/search?q=${encodeURIComponent(job.title)}`;

  // Compact variant - for lists
  if (variant === "compact") {
    return (
      <Link
        href={jobLink}
        className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#6366f1]/30 hover:shadow-lg hover:shadow-[#6366f1]/5 transition-all duration-300"
      >
        <div className="flex-shrink-0">
          {job.companies.logo ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-[#6366f1]/20 transition-all">
              <Image
                src={job.companies.logo}
                alt={`${job.companies.name} Logo`}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg shadow-md">
              {job.companies.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-[#4f46e5] transition-colors truncate">
            {highlightQuery ? (
              <HighlightedText text={job.title} highlight={highlightQuery} />
            ) : (
              job.title
            )}
          </h3>
          <p className="text-sm text-gray-500 truncate">{job.schemaOrganizationName || job.companies.name}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {highlightQuery ? (
                <HighlightedText text={job.location} highlight={highlightQuery} />
              ) : (
                job.location
              )}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {displayType}
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent text-sm">{salaryText}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </p>
        </div>
      </Link>
    );
  }

  // Featured variant - for hero/grid display
  if (variant === "featured") {
    return (
      <Link
        href={jobLink}
        className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-[#6366f1]/10 hover:border-[#6366f1]/20 hover:-translate-y-1 transition-all duration-300"
      >
        {/* Aurora top bar */}
        <div className="relative flex-shrink-0 h-2 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4]" />

        <div className="p-5 flex flex-col flex-1">
          {/* Company + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              {job.companies.logo ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-[#6366f1]/20 transition-all">
                  <Image
                    src={job.companies.logo}
                    alt={job.companies.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {job.companies.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 mb-1">{job.schemaOrganizationName || job.companies.name}</p>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#4f46e5] transition-colors line-clamp-2">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#eef2ff] text-[#4f46e5] text-xs rounded-lg font-medium">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
              <Briefcase className="w-3 h-3" />
              {displayType}
            </span>
            {job.isRemote && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ecfdf5] text-[#059669] text-xs rounded-lg">
                {t.remote}
              </span>
            )}
            {job.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fffbeb] text-[#d97706] text-xs rounded-lg font-medium">
                <Sparkles className="w-3 h-3" />
                {t.hot}
              </span>
            )}
          </div>

          {/* Bottom */}
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
              {salaryText}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
              <span className="text-[#6366f1] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {t.viewDetail}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <div className="group block bg-white rounded-xl border border-gray-100 p-4 md:p-5 hover:border-[#6366f1]/30 hover:shadow-lg hover:shadow-[#6366f1]/5 hover:-translate-y-0.5 transition-all duration-300 relative">
      {showFavorite && (
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
          <HeartButton jobId={job.id} size="sm" />
        </div>
      )}
      <Link href={jobLink}>
        {/* Mobile: Stack layout, Desktop: Row layout */}
        <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
          <div className="flex-shrink-0">
            {job.companies.logo ? (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-[#6366f1]/20 transition-all">
                <Image
                  src={job.companies.logo}
                  alt={job.companies.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md">
                {job.companies.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title + Salary row */}
            <div className="flex items-start justify-between gap-2 md:gap-4">
              <div className={showFavorite ? "pr-10 md:pr-12" : ""}>
                <h3 className="font-bold text-base md:text-lg text-gray-900 group-hover:text-[#4f46e5] transition-colors">
                  {job.title}
                </h3>
                <p className="text-gray-600 text-xs md:text-sm">{job.schemaOrganizationName || job.companies.name}</p>
              </div>
              <span className="text-base md:text-lg font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent flex-shrink-0">
                {salaryText}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-2 md:mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 bg-gray-50 text-gray-600 text-xs md:text-sm rounded-lg">
                <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="truncate max-w-[120px] md:max-w-none">{job.location}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 bg-gray-50 text-gray-600 text-xs md:text-sm rounded-lg">
                <Briefcase className="w-3 h-3 md:w-3.5 md:h-3.5" />
                {displayType}
              </span>
              {job.isRemote && (
                <span className="inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 bg-[#ecfdf5] text-[#059669] text-xs md:text-sm rounded-lg">
                  {t.remoteOffice}
                </span>
              )}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-50">
              <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {timeAgo}
                </span>
              </div>
              <span className="text-[#6366f1] text-xs md:text-sm font-medium opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {t.viewDetail}
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
