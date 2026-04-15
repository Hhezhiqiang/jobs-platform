"use client";

import Link from "next/link";
import Image from "next/image";
import { jobs, companies } from "@prisma/client";
import { formatDistanceToNow, formatSalary, cn } from "@/lib/utils";
import { HeartButton } from "./heart-button";
import { HighlightedText } from "./highlighted-text";
import { CultureTag, CULTURE_TAGS, calculateMatchScore, getMatchingTags } from "./job-preference-modal";

interface JobCardV3Props {
  job: jobs & { companies: companies };
  variant?: "default" | "compact" | "featured";
  showFavorite?: boolean;
  highlightQuery?: string;
  // 文化匹配相关
  userCultureTags?: CultureTag[];
  showMatchScore?: boolean;
}

// 获取公司文化标签的显示信息
function getCompanyTagInfo(tagId: string) {
  return CULTURE_TAGS.find(t => t.id === tagId) || { 
    id: tagId, 
    label: tagId, 
    icon: "🏷️",
    description: "" 
  };
}

// 匹配度进度条颜色
function getMatchScoreColor(score: number): string {
  if (score >= 80) return "bg-gradient-to-r from-green-500 to-emerald-500";
  if (score >= 60) return "bg-gradient-to-r from-blue-500 to-cyan-500";
  if (score >= 40) return "bg-gradient-to-r from-yellow-500 to-orange-500";
  return "bg-gray-400";
}

// 匹配度文字颜色
function getMatchScoreTextColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-yellow-600";
  return "text-gray-500";
}

export function JobCardV3({
  job,
  variant = "default",
  showFavorite = true,
  highlightQuery,
  userCultureTags = [],
  showMatchScore = false,
}: JobCardV3Props) {
  const salaryText = formatSalary(job.salaryMin, job.salaryMax);
  const timeAgo = formatDistanceToNow(job.datePosted);
  
  // 获取公司文化标签
  const companyTags = (job.companies as any)?.cultureTags || [];
  
  // 计算匹配度
  const matchScore = showMatchScore && userCultureTags.length > 0
    ? calculateMatchScore(companyTags, userCultureTags)
    : 0;
  
  // 获取匹配的标签
  const matchingTags = showMatchScore && userCultureTags.length > 0
    ? getMatchingTags(companyTags, userCultureTags)
    : [];
  
  // 是否文化契合（>80%）
  const isCultureFit = matchScore >= 80;

  // 紧凑版
  if (variant === "compact") {
    return (
      <Link
        href={`/jobs/${job.slug}`}
        className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
      >
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {job.companies.logo ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
              <Image
                src={job.companies.logo}
                alt={`${job.companies.name} 公司Logo`}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {job.companies.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {highlightQuery ? (
                <HighlightedText text={job.title} highlight={highlightQuery} />
              ) : (
                job.title
              )}
            </h3>
            {/* 文化契合 Badge */}
            {isCultureFit && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                文化契合
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {highlightQuery ? (
              <HighlightedText text={job.companies.name} highlight={highlightQuery} />
            ) : (
              job.companies.name
            )}
          </p>
          
          {/* 公司文化标签（最多3个） */}
          {companyTags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {companyTags.slice(0, 3).map((tagId: string) => {
                const tag = getCompanyTagInfo(tagId);
                const isMatching = matchingTags.includes(tagId);
                return (
                  <span
                    key={tagId}
                    className={cn(
                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-md",
                      isMatching
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-600"
                    )}
                    title={tag.description}
                  >
                    {tag.icon} {tag.label}
                  </span>
                );
              })}
              {companyTags.length > 3 && (
                <span className="text-xs text-gray-400">+{companyTags.length - 3}</span>
              )}
            </div>
          )}
          
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

        {/* Salary & Match Score */}
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-blue-600">{salaryText}</p>
          
          {/* 匹配度显示 */}
          {showMatchScore && userCultureTags.length > 0 && (
            <div className="mt-1.5">
              <div className="flex items-center justify-end gap-1.5">
                <span className={cn("text-xs font-medium", getMatchScoreTextColor(matchScore))}>
                  {matchScore}% 匹配
                </span>
              </div>
              {/* 迷你进度条 */}
              <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 ml-auto overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", getMatchScoreColor(matchScore))}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
        </div>
      </Link>
    );
  }

  // 精选版
  if (variant === "featured") {
    return (
      <Link
        href={`/jobs/${job.slug}`}
        className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      >
        {/* Featured Badge */}
        <div className="relative flex-shrink-0">
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
            <div className="h-40 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
              </div>
            </div>
          )}
          
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
              🔥 热招
            </span>
            {/* 文化契合标签 */}
            {isCultureFit && (
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full shadow-lg">
                ✨ 文化契合
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          {/* Company */}
          <div className="flex items-center gap-3 mb-3">
            {job.companies.logo ? (
              <Image
                src={job.companies.logo}
                alt={`${job.companies.name} 公司Logo`}
                width={40}
                height={40}
                className="rounded-lg"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {job.companies.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{job.companies.name}</p>
              <p className="text-xs text-gray-500">{job.companies.industry || "互联网"}</p>
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
          
          {/* 公司文化标签 */}
          {companyTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {companyTags.slice(0, 3).map((tagId: string) => {
                const tag = getCompanyTagInfo(tagId);
                const isMatching = matchingTags.includes(tagId);
                return (
                  <span
                    key={tagId}
                    className={cn(
                      "inline-flex items-center gap-0.5 px-2 py-1 text-xs rounded-lg",
                      isMatching
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-50 text-gray-600"
                    )}
                  >
                    {tag.icon} {tag.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <span className="text-xl font-bold text-blue-600">{salaryText}</span>
              {/* 匹配度 */}
              {showMatchScore && userCultureTags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", getMatchScoreColor(matchScore))}
                      style={{ width: `${matchScore}%` }}
                    />
                  </div>
                  <span className={cn("text-xs", getMatchScoreTextColor(matchScore))}>
                    {matchScore}%
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-400">{timeAgo}</span>
          </div>
        </div>
      </Link>
    );
  }

  // 默认版
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
            {job.companies.logo ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
                <Image
                  src={job.companies.logo}
                  alt={`${job.companies.name} 公司Logo`}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {job.companies.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className={showFavorite ? "pr-12" : ""}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>
                  {/* 文化契合 Badge */}
                  {isCultureFit && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      文化契合
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{job.companies.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-lg font-bold text-blue-600">{salaryText}</span>
              </div>
            </div>

            {/* 公司文化标签 */}
            {companyTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {companyTags.slice(0, 3).map((tagId: string) => {
                  const tag = getCompanyTagInfo(tagId);
                  const isMatching = matchingTags.includes(tagId);
                  return (
                    <span
                      key={tagId}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg",
                        isMatching
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-gray-50 text-gray-600"
                      )}
                      title={tag.description}
                    >
                      {tag.icon} {tag.label}
                    </span>
                  );
                })}
                {companyTags.length > 3 && (
                  <span className="text-xs text-gray-400">+{companyTags.length - 3}</span>
                )}
                
                {/* 匹配度显示 */}
                {showMatchScore && userCultureTags.length > 0 && matchScore > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", getMatchScoreColor(matchScore))}
                        style={{ width: `${matchScore}%` }}
                      />
                    </div>
                    <span className={cn("text-xs font-medium", getMatchScoreTextColor(matchScore))}>
                      {matchScore}%
                    </span>
                  </div>
                )}
              </div>
            )}

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
