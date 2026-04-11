"use client";

import { useState } from "react";
import { Search, MapPin, Briefcase, DollarSign, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  currentParams: {
    q?: string;
    city?: string;
    type?: string;
    minSalary?: string;
    maxSalary?: string;
  };
  cities: string[];
  totalJobs: number;
}

const jobTypes = [
  { value: "FULL_TIME", label: "全职", icon: "💼" },
  { value: "PART_TIME", label: "兼职", icon: "⏰" },
  { value: "INTERNSHIP", label: "实习", icon: "🎓" },
  { value: "CONTRACT", label: "合同", icon: "📝" },
  { value: "FREELANCE", label: "自由职业", icon: "🏠" },
];

const salaryRanges = [
  { min: "0", max: "10000", label: "10K以下" },
  { min: "10000", max: "20000", label: "10K-20K" },
  { min: "20000", max: "30000", label: "20K-30K" },
  { min: "30000", max: "50000", label: "30K-50K" },
  { min: "50000", max: "", label: "50K以上" },
];

// 构建筛选URL，保留所有当前参数
function buildFilterUrl(
  baseUrl: string,
  currentParams: FilterSidebarProps["currentParams"],
  newParams: Partial<FilterSidebarProps["currentParams"]>
): string {
  const params = new URLSearchParams();
  
  // 合并参数
  const mergedParams = { ...currentParams, ...newParams };
  
  // 添加所有非空参数
  if (mergedParams.q) params.set("q", mergedParams.q);
  if (mergedParams.city) params.set("city", mergedParams.city);
  if (mergedParams.type) params.set("type", mergedParams.type);
  if (mergedParams.minSalary) params.set("minSalary", mergedParams.minSalary);
  if (mergedParams.maxSalary) params.set("maxSalary", mergedParams.maxSalary);
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function FilterSidebar({ currentParams, cities, totalJobs }: FilterSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasFilters = Object.values(currentParams).some(Boolean);

  return (
    <div className="space-y-4">
      {/* 搜索卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          搜索职位
        </h3>
        <form action="/jobs" className="space-y-3">
          {/* 保留当前筛选参数 */}
          {currentParams.city && <input type="hidden" name="city" value={currentParams.city} />}
          {currentParams.type && <input type="hidden" name="type" value={currentParams.type} />}
          {currentParams.minSalary && <input type="hidden" name="minSalary" value={currentParams.minSalary} />}
          {currentParams.maxSalary && <input type="hidden" name="maxSalary" value={currentParams.maxSalary} />}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={currentParams.q}
              placeholder="关键词..."
              aria-label="搜索职位关键词"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg"
          >
            搜索
          </button>
        </form>
      </div>

      {/* 筛选卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div 
          className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            筛选条件
            {hasFilters && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                已筛选
              </span>
            )}
          </h3>
          <svg 
            className={cn("w-5 h-5 text-gray-400 transition-transform", isExpanded && "rotate-180")}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isExpanded && (
          <div className="px-6 pb-6 space-y-6">
            {/* 工作地点 */}
            {cities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  工作地点
                </h4>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={buildFilterUrl("/jobs", currentParams, { city: undefined })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all",
                      !currentParams.city
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    全部
                  </a>
                  {cities.filter(Boolean).map((city) => (
                    <a
                      key={city}
                      href={buildFilterUrl("/jobs", currentParams, { city })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-all",
                        currentParams.city === city
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {city}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 职位类型 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">职位类型</h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildFilterUrl("/jobs", currentParams, { type: undefined })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                    !currentParams.type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  全部
                </a>
                {jobTypes.map((type) => (
                  <a
                    key={type.value}
                    href={buildFilterUrl("/jobs", currentParams, { type: type.value })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all",
                      currentParams.type === type.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {type.icon} {type.label}
                  </a>
                ))}
              </div>
            </div>

            {/* 薪资范围 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                薪资范围
              </h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildFilterUrl("/jobs", currentParams, { minSalary: undefined, maxSalary: undefined })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                    !currentParams.minSalary && !currentParams.maxSalary
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  全部
                </a>
                {salaryRanges.map((range) => (
                  <a
                    key={range.label}
                    href={buildFilterUrl("/jobs", currentParams, { minSalary: range.min, maxSalary: range.max || undefined })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all",
                      currentParams.minSalary === range.min
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {range.label}
                  </a>
                ))}
              </div>
            </div>

            {/* 清除筛选 */}
            {hasFilters && (
              <a
                href="/jobs"
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                清除筛选
              </a>
            )}
          </div>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <p className="text-blue-100 mb-1">当前筛选结果</p>
        <p className="text-3xl font-bold">{totalJobs.toLocaleString()}</p>
        <p className="text-blue-100">个职位</p>
      </div>
    </div>
  );
}
