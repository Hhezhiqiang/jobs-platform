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
  onClear: () => void;
}

const jobTypes = [
  { value: "FULL_TIME", label: "全职", icon: "💼" },
  { value: "PART_TIME", label: "兼职", icon: "⏰" },
  { value: "INTERNSHIP", label: "实习", icon: "🎓" },
  { value: "CONTRACT", label: "合同", icon: "📝" },
  { value: "REMOTE", label: "远程", icon: "🏠" },
];

const salaryRanges = [
  { min: "0", max: "10000", label: "10K以下" },
  { min: "10000", max: "20000", label: "10K-20K" },
  { min: "20000", max: "30000", label: "20K-30K" },
  { min: "30000", max: "50000", label: "30K-50K" },
  { min: "50000", max: "", label: "50K以上" },
];

export function FilterSidebar({ currentParams, cities, totalJobs, onClear }: FilterSidebarProps) {
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={currentParams.q}
              placeholder="关键词..."
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
                    href="/jobs"
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
                      href={`/jobs?city=${encodeURIComponent(city)}${currentParams.q ? `&q=${currentParams.q}` : ""}`}
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
                  href="/jobs"
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
                    href={`/jobs?type=${type.value}${currentParams.q ? `&q=${currentParams.q}` : ""}${currentParams.city ? `&city=${currentParams.city}` : ""}`}
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
                  href="/jobs"
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
                    href={`/jobs?minSalary=${range.min}${range.max ? `&maxSalary=${range.max}` : ""}${currentParams.q ? `&q=${currentParams.q}` : ""}${currentParams.city ? `&city=${currentParams.city}` : ""}${currentParams.type ? `&type=${currentParams.type}` : ""}`}
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
              <button
                onClick={onClear}
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                清除筛选
              </button>
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
