import Link from "next/link";
import Image from "next/image";
import { jobs, companies } from "@prisma/client";
import { formatDistanceToNow, formatSalary } from "@/lib/utils";
import { HeartButton } from "./heart-button";
import { HighlightedText } from "./highlighted-text";
import { MapPin, Briefcase, Clock, ArrowRight, Sparkles } from "lucide-react";

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

  if (variant === "compact") {
    return (
      <Link
        href={`/${locale}/jobs/${job.slug}`}
        className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300"
      >
        <div className="flex-shrink-0">
          {job.companies.logo ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {job.companies.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {highlightQuery ? (
              <HighlightedText text={job.title} highlight={highlightQuery} />
            ) : (
              job.title
            )}
          </h3>
          <p className="text-sm text-gray-500 truncate">{job.companies.name}</p>
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
          <p className="font-bold text-blue-600 text-sm">{salaryText}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        href={`/${locale}/jobs/${job.slug}`}
        className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        <div className="relative flex-shrink-0 h-32 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          {job.imageUrl ? (
            <Image
              src={job.imageUrl}
              alt={job.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-24 h-24 bg-blue-500/30 rounded-full blur-2xl" />
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-xs font-bold rounded-full shadow-lg">
              <Sparkles className="w-3 h-3" />
              {t.hot}
            </span>
          </div>

          <div className="absolute -bottom-6 left-4">
            {job.companies.logo ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-4 ring-white shadow-lg">
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
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white">
                {job.companies.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 pt-8 flex flex-col flex-1">
          <p className="text-sm text-gray-500 mb-1">{job.companies.name}</p>
          
          <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
            {job.title}
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
              <Briefcase className="w-3 h-3" />
              {displayType}
            </span>
            {job.isRemote && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg">
                {t.remote}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {salaryText}
            </span>
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group block bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative">
      {showFavorite && (
        <div className="absolute top-4 right-4 z-10">
          <HeartButton jobId={job.id} size="sm" />
        </div>
      )}
      <Link href={`/${locale}/jobs/${job.slug}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {job.companies.logo ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
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
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {job.companies.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className={showFavorite ? "pr-12" : ""}>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>
                <p className="text-gray-600 text-sm">{job.companies.name}</p>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex-shrink-0">
                {salaryText}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-sm rounded-lg">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-sm rounded-lg">
                <Briefcase className="w-3.5 h-3.5" />
                {displayType}
              </span>
              {job.isRemote && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-sm rounded-lg">
                  {t.remoteOffice}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo}
                </span>
                {job.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    {t.hot}
                  </span>
                )}
              </div>
              <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {t.viewDetail}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
