"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { JobCardV2 } from "@/components/aurora/job-card";
import { Search, MapPin, Briefcase, DollarSign, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { jobs, companies } from "@prisma/client";

interface JobsPageClientProps {
  initialJobs: (jobs & { companies: companies })[];
  total: number;
  totalPages: number;
  currentPage: number;
  cities: string[];
  dbError: boolean;
  currentParams: Record<string, string | undefined>;
}

const typeOptions = [
  { value: "FULL_TIME", label: "全职" },
  { value: "PART_TIME", label: "兼职" },
  { value: "CONTRACT", label: "合同" },
  { value: "INTERNSHIP", label: "实习" },
  { value: "FREELANCE", label: "自由职业" },
];

export function JobsPageClient({ initialJobs, total, totalPages, currentPage, cities, dbError, currentParams }: JobsPageClientProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentParams.q || "");
  const [selectedCity, setSelectedCity] = useState(currentParams.city || "");
  const [selectedType, setSelectedType] = useState(currentParams.type || "");
  const [minSalary, setMinSalary] = useState(currentParams.minSalary || "");
  const [maxSalary, setMaxSalary] = useState(currentParams.maxSalary || "");

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedCity || selectedType || minSalary || maxSalary;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedType) params.set("type", selectedType);
    if (minSalary) params.set("minSalary", minSalary);
    if (maxSalary) params.set("maxSalary", maxSalary);
    window.location.href = `/zh/jobs${params.toString() ? "?" + params.toString() : ""}`;
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setSelectedType("");
    setMinSalary("");
    setMaxSalary("");
    window.location.href = "/zh/jobs";
  };

  if (dbError) {
    return (
      <div className="min-h-screen bg-[#f8f7fc] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">服务暂时不可用</h2>
          <p className="text-gray-500 mb-6">数据库连接失败，请稍后重试</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-medium hover:shadow-lg transition-all">
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      {/* Aurora Search Header */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-white/60">
              <li><Link href="/zh" className="hover:text-white transition-colors">首页</Link></li>
              <li>/</li>
              <li className="text-white">职位列表</li>
            </ol>
          </nav>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            找到你的
            <span className="bg-gradient-to-r from-[#a5b4fc] to-[#22d3ee] bg-clip-text text-transparent"> 理想职位</span>
          </h1>

          {/* Search Box */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="search"
                  placeholder="搜索职位、公司、技能..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-12 pr-4 py-3.5 text-white bg-white/5 rounded-xl border border-white/10 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border transition-all ${showFilters || hasActiveFilters ? "bg-[#6366f1] border-[#6366f1] text-white" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
              >
                <Filter className="w-4 h-4" />
                筛选
                {hasActiveFilters && <span className="w-2 h-2 bg-[#fbbf24] rounded-full" />}
              </button>
              <button
                onClick={handleSearch}
                className="px-8 py-3.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all"
              >
                搜索职位
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-white bg-white/5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 appearance-none"
                  >
                    <option value="" className="bg-[#1e1b4b]">全部城市</option>
                    {cities.map((city) => (
                      <option key={city} value={city} className="bg-[#1e1b4b]">{city}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-white bg-white/5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 appearance-none"
                  >
                    <option value="" className="bg-[#1e1b4b]">全部类型</option>
                    {typeOptions.map((type) => (
                      <option key={type.value} value={type.value} className="bg-[#1e1b4b]">{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="number"
                    placeholder="最低薪资 (K)"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-white bg-white/5 rounded-xl border border-white/10 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className="flex-1 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    应用筛选
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/15 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="mt-4 text-white/60 text-sm">
            找到 <span className="text-white font-semibold">{total}</span> 个职位
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="ml-2 text-[#a5b4fc] hover:text-white transition-colors">
                清除筛选
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {initialJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-[#eef2ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#6366f1]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">没有找到匹配的职位</h3>
            <p className="text-gray-500 mb-6">尝试调整搜索条件或清除筛选</p>
            <button onClick={handleClearFilters} className="px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-medium hover:shadow-lg transition-all">
              清除筛选
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {initialJobs.map((job) => (
              <JobCardV2 key={job.id} job={job} variant="default" locale="zh" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {currentPage > 1 && (
              <Link href={`?${new URLSearchParams({ ...currentParams, page: String(currentPage - 1) })}`} className="flex items-center gap-1 px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-gray-600 hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all">
                <ChevronLeft className="w-4 h-4" />
                上一页
              </Link>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <Link
                  key={page}
                  href={`?${new URLSearchParams({ ...currentParams, page: String(page) })}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-all ${page === currentPage ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md" : "bg-white border border-gray-100 text-gray-600 hover:border-[#6366f1]/30"}`}
                >
                  {page}
                </Link>
              );
            })}
            {currentPage < totalPages && (
              <Link href={`?${new URLSearchParams({ ...currentParams, page: String(currentPage + 1) })}`} className="flex items-center gap-1 px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-gray-600 hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all">
                下一页
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
