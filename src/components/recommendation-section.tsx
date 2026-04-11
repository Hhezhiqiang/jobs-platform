"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { JobCardV2 } from "./job-card-v2";
import { Job, Company } from "@prisma/client";
import { getUserBehaviorData } from "@/lib/recommendations";
import { Sparkles, Loader2, RefreshCw, User } from "lucide-react";

interface RecommendedJob extends Job {
  company: Company;
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
}

export function RecommendationSection({ 
  limit = 6,
  className = "" 
}: RecommendationSectionProps) {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = status === "authenticated";

  useEffect(() => {
    fetchRecommendations();
  }, [isLoggedIn, limit]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 构建 URL
      let url = `/api/recommendations?limit=${limit}`;
      
      // 如果未登录，尝试从 localStorage 获取技能标签
      if (!isLoggedIn) {
        const behaviorData = getUserBehaviorData();
        if (behaviorData.skills.length > 0) {
          url += `&skills=${encodeURIComponent(behaviorData.skills.join(","))}`;
        }
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("获取推荐失败");
      }

      const data: RecommendationData = await response.json();
      setRecommendations(data);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("加载推荐职位失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchRecommendations();
  };

  // 获取标题文本
  const getTitle = () => {
    if (recommendations?.isPersonalized) {
      return (<>
          <Sparkles className="w-6 h-6 text-yellow-500" />
          为您推荐
        </>
      );
    }
    return "🔥 热门职位";
  };

  // 获取副标题文本
  const getSubtitle = () => {
    if (recommendations?.isPersonalized) {
      if (recommendations.userSkills && recommendations.userSkills.length > 0) {
        return `基于您的技能标签: ${recommendations.userSkills.slice(0, 3).join(", ")}${recommendations.userSkills.length > 3 ? "..." : ""}`;
      }
      return "根据您的浏览和申请历史智能推荐";
    }
    return "精选优质岗位，助你快速入职";
  };

  // 加载状态
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

  // 错误状态
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
              重试
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 空状态
  if (!recommendations?.jobs?.length) {
    return (
      <section className={`py-16 bg-gradient-to-b from-blue-50/50 to-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              暂无推荐职位
            </h3>
            <p className="text-gray-500 mb-6">
              {isLoggedIn 
                ? "浏览更多职位以获取个性化推荐" 
                : "登录后可获得更精准的职位推荐"}
            </p>
            {!isLoggedIn && (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <User className="w-4 h-4" />
                立即登录
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
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {getTitle()}
              </h2>
              {recommendations?.isPersonalized && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  个性化
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
              title="刷新推荐"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/jobs"
              className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
            >
              查看全部
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.jobs.map((job) => (
            <div key={job.id} className="relative group">
              <JobCardV2 job={job} variant="featured" />
              
              {/* 匹配度标签 */}
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
                    匹配度 {Math.round(job.matchScore)}%
                  </div>
                </div>
              )}

              {/* 推荐理由提示 */}
              {recommendations?.isPersonalized && job.matchReasons.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg">
                    {job.matchReasons[0]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
          >
            查看全部职位
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 提示信息 */}
        {!isLoggedIn && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <User className="w-5 h-5 text-blue-600" />
              <span className="text-gray-600">
                登录后可获得基于技能标签的精准推荐
              </span>
              <Link
                href="/auth/login"
                className="text-blue-600 font-medium hover:underline"
              >
                立即登录 →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
