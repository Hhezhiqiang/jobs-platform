"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JobCardV3 } from "@/components/job-card-v3";
import { FilterSidebarV2 } from "@/components/filter-sidebar-v2";
import { Breadcrumb } from "@/components/breadcrumb";
import { 
  JobPreferenceModal, 
  JobPreferenceButton,
  getStoredPreferences,
  type JobPreferences,
  type CultureTag,
  calculateMatchScore,
  CULTURE_TAGS,
} from "@/components/job-preference-modal";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// 职位数据接口
interface Job {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements?: string | null;
  benefits?: string | null;
  employmentType: string;
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  location: string;
  city: string | null;
  country: string;
  isRemote: boolean;
  isHybrid: boolean;
  applyUrl: string;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  datePosted: string;
  companies: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    industry: string | null;
    size: string | null;
    location: string | null;
    cultureTags: string[];
  };
}

interface JobsPageClientProps {
  initialJobs: Job[];
  total: number;
  cities: string[];
  dbError: boolean;
  currentParams: {
    q?: string;
    city?: string;
    type?: string;
    minSalary?: string;
    maxSalary?: string;
    cultureTag?: string;
    onlyMatched?: string;
    sort?: string;
    page?: string;
  };
}

export function JobsPageClient({ initialJobs, total, cities, dbError, currentParams }: JobsPageClientProps) {
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<JobPreferences | null>(() => {
    if (typeof window === "undefined") return null;
    return getStoredPreferences();
  });
  const mounted = typeof window !== "undefined";

  // 重新加载偏好设置（当模态框关闭时）
  const handlePreferencesChange = useCallback(() => {
    const stored = getStoredPreferences();
    setPreferences(stored);
  }, []);

  // 处理只显示文化契合职位的切换
  const handleToggleOnlyMatched = useCallback(() => {
    const newValue = currentParams.onlyMatched === "true" ? undefined : "true";
    const params = new URLSearchParams(window.location.search);
    
    if (newValue) {
      params.set("onlyMatched", newValue);
    } else {
      params.delete("onlyMatched");
    }
    
    window.location.href = `${window.location.pathname}?${params.toString()}`;
  }, [currentParams.onlyMatched]);

  // 处理排序切换
  const handleSortChange = useCallback((sort: "date" | "match") => {
    const params = new URLSearchParams(window.location.search);
    
    if (sort === "match") {
      params.set("sort", "match");
    } else {
      params.delete("sort");
    }
    
    window.location.href = `${window.location.pathname}?${params.toString()}`;
  }, []);

  // 计算带匹配度的职位列表
  const jobsWithMatchScore = useMemo(() => {
    if (!preferences?.cultureTags.length) {
      return initialJobs.map(job => ({ ...job, matchScore: 0 }));
    }
    
    return initialJobs.map(job => {
      const companyTags = job.companies.cultureTags || [];
      const matchScore = calculateMatchScore(companyTags, preferences.cultureTags);
      return { ...job, matchScore };
    });
  }, [initialJobs, preferences]);

  // 筛选和排序后的职位
  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobsWithMatchScore];

    // 只显示文化契合职位筛选
    if (currentParams.onlyMatched === "true" && preferences?.cultureTags.length) {
      result = result.filter(job => job.matchScore >= 80);
    }

    // 按文化标签筛选职位
    if (currentParams.cultureTag) {
      result = result.filter(job => 
        job.companies.cultureTags?.includes(currentParams.cultureTag!)
      );
    }

    // 排序
    const sortBy = currentParams.sort || preferences?.sortBy || "date";
    if (sortBy === "match" && preferences?.cultureTags.length) {
      result.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      // 默认按发布时间排序
      result.sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
    }

    return result;
  }, [jobsWithMatchScore, currentParams, preferences]);

  // 计算文化契合职位数量
  const cultureFitCount = useMemo(() => {
    if (!preferences?.cultureTags.length) return 0;
    return jobsWithMatchScore.filter(job => job.matchScore >= 80).length;
  }, [jobsWithMatchScore, preferences]);

  const page = parseInt(currentParams.page || "1");
  const limit = 20;
  const totalPages = Math.ceil((filteredAndSortedJobs.length > 0 ? filteredAndSortedJobs.length : total) / limit);

  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    if (currentParams.q) params.set("q", currentParams.q);
    if (currentParams.city) params.set("city", currentParams.city);
    if (currentParams.type) params.set("type", currentParams.type);
    if (currentParams.minSalary) params.set("minSalary", currentParams.minSalary);
    if (currentParams.maxSalary) params.set("maxSalary", currentParams.maxSalary);
    if (currentParams.cultureTag) params.set("cultureTag", currentParams.cultureTag);
    if (currentParams.onlyMatched) params.set("onlyMatched", currentParams.onlyMatched);
    if (currentParams.sort) params.set("sort", currentParams.sort);
    params.set("page", pageNum.toString());
    return `/jobs?${params.toString()}`;
  };

  if (!mounted) {
    return null;
  }

  const hasPreferences = preferences && preferences.cultureTags.length > 0;
  const currentSort = currentParams.sort || preferences?.sortBy || "date";
  const isCultureFitFilterActive = currentParams.onlyMatched === "true";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-2">
            <Breadcrumb items={[{ label: "职位列表", href: "/jobs" }]} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentParams.q ? `"${currentParams.q}" 的搜索结果` : "全部职位"}
            </h1>
            <JobPreferenceButton
              onClick={() => setIsPreferenceModalOpen(true)}
              hasPreferences={!!hasPreferences}
              matchCount={cultureFitCount > 0 ? cultureFitCount : undefined}
            />
          </div>
          
          {/* 偏好设置提示条 */}
          {hasPreferences && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900">
                  已设置 {preferences.cultureTags.length} 个偏好标签
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.cultureTags.map(tagId => {
                  const tag = CULTURE_TAGS.find(t => t.id === tagId);
                  return tag ? (
                    <span
                      key={tagId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white text-blue-700 text-xs rounded-md border border-blue-200"
                    >
                      {tag.icon} {tag.label}
                    </span>
                  ) : null;
                })}
              </div>
              {cultureFitCount > 0 && (
                <span className="ml-auto text-sm text-green-600 font-medium">
                  {cultureFitCount} 个文化契合职位
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 筛选侧边栏 */}
          <div className="lg:col-span-1">
            <FilterSidebarV2
              currentParams={currentParams}
              cities={cities}
              totalJobs={filteredAndSortedJobs.length}
              userCultureTags={preferences?.cultureTags || []}
              hasPreferences={!!hasPreferences}
              onToggleOnlyMatched={handleToggleOnlyMatched}
            />
          </div>

          {/* 职位列表 */}
          <div className="lg:col-span-3">
            {dbError ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">服务暂时不可用</h3>
                <p className="text-gray-500 mb-6">数据库连接失败，请稍后重试</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  重新加载
                </Link>
              </div>
            ) : filteredAndSortedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isCultureFitFilterActive ? "暂无文化契合职位" : "未找到相关职位"}
                </h3>
                <p className="text-gray-500 mb-2">
                  {isCultureFitFilterActive 
                    ? "当前筛选条件下没有找到匹配度 ≥ 80% 的职位" 
                    : "尝试调整搜索关键词或筛选条件"}
                </p>
                {hasPreferences && isCultureFitFilterActive && (
                  <p className="text-sm text-gray-400 mb-6">
                    您可以：
                    <button 
                      onClick={() => setIsPreferenceModalOpen(true)}
                      className="text-blue-600 hover:underline mx-1"
                    >
                      调整偏好设置
                    </button>
                    或
                    <button 
                      onClick={handleToggleOnlyMatched}
                      className="text-blue-600 hover:underline mx-1"
                    >
                      查看全部职位
                    </button>
                  </p>
                )}
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                  >
                    查看全部职位
                  </Link>
                  {hasPreferences && (
                    <button
                      onClick={() => setIsPreferenceModalOpen(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      调整偏好
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* 列表头部：统计和排序 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <p className="text-gray-600">
                    共 <span className="font-semibold text-gray-900">{filteredAndSortedJobs.length.toLocaleString()}</span> 个职位
                    {hasPreferences && cultureFitCount > 0 && (
                      <span className="ml-2 text-sm">
                        （<span className="text-green-600 font-medium">{cultureFitCount}</span> 个文化契合）
                      </span>
                    )}
                  </p>
                  
                  {/* 排序选项 */}
                  {hasPreferences && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">排序：</span>
                      <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button
                          onClick={() => handleSortChange("date")}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-md transition-all",
                            currentSort === "date"
                              ? "bg-blue-600 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          📅 发布时间
                        </button>
                        <button
                          onClick={() => handleSortChange("match")}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-md transition-all",
                            currentSort === "match"
                              ? "bg-blue-600 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          ✨ 匹配度
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {filteredAndSortedJobs.map((job) => (
                    <JobCardV3
                      key={job.id}
                      job={job as any}
                      variant="compact"
                      userCultureTags={preferences?.cultureTags || []}
                      showMatchScore={!!hasPreferences}
                    />
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    {page > 1 && (
                      <Link
                        href={buildPageUrl(page - 1)}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        上一页
                      </Link>
                    )}

                    <div className="flex items-center gap-1">
                      {/* 第一页 */}
                      {page > 3 && (
                        <>
                          <Link
                            href={buildPageUrl(1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            1
                          </Link>
                          {page > 4 && <span className="px-2 text-gray-400">...</span>}
                        </>
                      )}

                      {/* 中间页码 */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Link
                            key={pageNum}
                            href={buildPageUrl(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-all ${
                              page === pageNum
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}

                      {/* 最后一页 */}
                      {page < totalPages - 2 && (
                        <>
                          {page < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                          <Link
                            href={buildPageUrl(totalPages)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            {totalPages}
                          </Link>
                        </>
                      )}
                    </div>

                    {page < totalPages && (
                      <Link
                        href={buildPageUrl(page + 1)}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        下一页
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* 求职偏好设置模态框 */}
      <JobPreferenceModal
        isOpen={isPreferenceModalOpen}
        onClose={() => {
          setIsPreferenceModalOpen(false);
          handlePreferencesChange();
        }}
      />
    </div>
  );
}
