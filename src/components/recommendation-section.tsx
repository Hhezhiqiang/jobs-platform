"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { jobs, companies } from "@prisma/client";
import { getUserBehaviorData } from "@/lib/recommendations";
import { Sparkles, Loader2, RefreshCw, User } from "lucide-react";
import { formatSalary } from "@/lib/utils";

type JobWithCompany = jobs & { companies: companies };

interface RecommendedJob extends jobs {
  companies: companies;
  matchScore: number;
  matchReasons: string[];
}

interface RecommendationData {
  jobs: RecommendedJob[];
  total: number;
  isPersonalized: boolean;
  userSkills?: string[];
}

interface RecommendationSectionProps {
  limit?: number;
  className?: string;
  initialJobs?: JobWithCompany[];
}

function getI18n(locale: string) {
  const isEn = locale === "en";
  return {
    isEn,
    typeMap: {
      FULL_TIME: isEn ? "Full-time" : "全职",
      PART_TIME: isEn ? "Part-time" : "兼职",
      CONTRACT: isEn ? "Contract" : "合同",
      INTERNSHIP: isEn ? "Internship" : "实习",
      FREELANCE: isEn ? "Freelance" : "自由职业",
    } as Record<string, string>,
    retry: isEn ? "Retry" : "重试",
    loginNow: isEn ? "Log in now" : "立即登录",
    personalized: isEn ? "Personalized" : "个性化",
    refreshTitle: isEn ? "Refresh Recommendations" : "刷新推荐",
    viewAll: isEn ? "View All" : "查看全部",
    viewAllJobs: isEn ? "View All Jobs" : "查看全部职位",
    match: isEn ? "Match" : "匹配度",
    hot: isEn ? "Hot" : "热招",
    tech: isEn ? "Tech" : "互联网",
    noJobsTitle: isEn ? "No Recommended Jobs Yet" : "暂无推荐职位",
    noJobsLogin: isEn ? "Browse more jobs for personalized recommendations" : "浏览更多职位以获取个性化推荐",
    noJobsGuest: isEn ? "Log in for more accurate job recommendations" : "登录后可获得更精准的职位推荐",
    skillsTitle: isEn ? "Log in for precise recommendations based on your skills" : "登录后可获得基于技能标签的精准推荐",
    recForYou: isEn ? "Recommended for You" : "为您推荐",
    hotJobs: isEn ? "🔥 Hot Jobs" : "🔥 热门职位",
    basedSkills: (skills: string[]) => {
      const shown = skills.slice(0, 3).join(", ");
      const more = skills.length > 3 ? "..." : "";
      return isEn ? `Based on your skills: ${shown}${more}` : `基于您的技能标签: ${shown}${more}`;
    },
    smartRec: isEn ? "Smart recommendations based on your browsing and application history" : "根据您的浏览和申请历史智能推荐",
    curated: isEn ? "Curated quality positions to help you land fast" : "精选优质岗位，助你快速入职",
    loadError: isEn ? "Failed to load recommendations" : "加载推荐职位失败，请稍后重试",
    fetchError: isEn ? "Failed to fetch recommendations" : "获取推荐失败",
  };
}

export function RecommendationSection({ 
  limit = 6,
  className = "",
  initialJobs = []
}: RecommendationSectionProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const i18n = getI18n(locale);
  const { isEn } = i18n;

  const [recommendations, setRecommendations] = useState<RecommendationData | null>(
    initialJobs.length > 0
      ? {
          jobs: initialJobs.map((job) => ({
            ...job,
            matchScore: 0,
            matchReasons: []
          })),
          total: initialJobs.length,
          isPersonalized: false
        }
      : null
  );
  const [isLoading, setIsLoading] = useState(!initialJobs.length);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = status === "authenticated";

  useEffect(() => {
    fetchRecommendations();
  }, [isLoggedIn, limit]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `/api/recommendations?limit=${limit}`;
      if (!isLoggedIn) {
        const behaviorData = getUserBehaviorData();
        if (behaviorData.skills.length > 0) {
          url += `&skills=${encodeURIComponent(behaviorData.skills.join(","))}`;
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(i18n.fetchError);
      }

      const data: RecommendationData = await response.json();
      setRecommendations(data);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError(i18n.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchRecommendations();
  };

  const getTitle = () => {
    if (recommendations?.isPersonalized) {
      return (<>
          <Sparkles className="w-6 h-6 text-yellow-500" />
          {i18n.recForYou}
        </>
      );
    }
    return i18n.hotJobs;
  };

  const getSubtitle = () => {
    if (recommendations?.isPersonalized) {
      if (recommendations.userSkills && recommendations.userSkills.length > 0) {
        return i18n.basedSkills(recommendations.userSkills);
      }
      return i18n.smartRec;
    }
    return i18n.curated;
  };

  if (isLoading) {
    return (
      <section className={`py-16 bg-gradient-to-b from-blue-50/50 to-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`py-16 bg-gradient-to-b from-blue-50/50 to-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {i18n.retry}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!recommendations?.jobs?.length) {
    return (
      <section className={`py-16 bg-gradient-to-b from-blue-50/50 to-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {i18n.noJobsTitle}
            </h3>
            <p className="text-gray-500 mb-6">
              {isLoggedIn ? i18n.noJobsLogin : i18n.noJobsGuest}
            </p>
            {!isLoggedIn && status !== "loading" && (
              <Link
                href={`/${locale}/auth/login`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <User className="w-4 h-4" />
                {i18n.loginNow}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-gradient-to-b from-blue-50/50 to-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {getTitle()}
              </h2>
              {recommendations?.isPersonalized && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {i18n.personalized}
                </span>
              )}
            </div>
            <p className="text-gray-600">{getSubtitle()}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title={i18n.refreshTitle}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href={`/${locale}/jobs`}
              className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
            >
              {i18n.viewAll}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {recommendations.jobs.map((job) => (
            <div key={job.id} className="relative group h-full">
              <Link
                href={`/${locale}/jobs/${job.slug}`}
                className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative flex-shrink-0">
                  {job.imageUrl ? (
                    <div className="h-40 relative overflow-hidden">
                      <Image
                        src={job.imageUrl}
                        alt={job.title}
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
                  
                  {recommendations?.isPersonalized && job.matchScore > 0 && (
                    <div className="absolute top-3 right-3 z-10">
                      <div 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.matchScore >= 80 
                            ? "bg-green-500 text-white" 
                            : job.matchScore >= 60 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-500 text-white"
                        }`}
                      >
                        {i18n.match} {Math.round(job.matchScore)}%
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
                      {i18n.hot}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {job.companies.logo ? (
                      <Image
                        src={job.companies.logo}
                        alt={`${job.companies.name} logo`}
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
                      <p className="text-xs text-gray-500">{job.companies.industry || i18n.tech}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {job.title}
                  </h3>

                  {recommendations?.isPersonalized && job.matchReasons.length > 0 && (
                    <div className="mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg">
                        {job.matchReasons[0]}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
                      {job.location}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                      {i18n.typeMap[job.employmentType] || job.employmentType}
                    </span>
                    {job.isRemote && (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-lg">
                        {isEn ? "Remote" : "远程"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xl font-bold text-blue-600">
                      {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(job.datePosted).toLocaleDateString(isEn ? "en-US" : "zh-CN")}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href={`/${locale}/jobs`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
          >
            {i18n.viewAllJobs}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {!isLoggedIn && status !== "loading" && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <User className="w-5 h-5 text-blue-600" />
              <span className="text-gray-600">
                {i18n.skillsTitle}
              </span>
              <Link
                href={`/${locale}/auth/login`}
                className="text-blue-600 font-medium hover:underline"
              >
                {isEn ? "Log in →" : "立即登录 →"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
