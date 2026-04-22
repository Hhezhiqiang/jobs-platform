"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Breadcrumb } from "@/components/breadcrumb";
import { JobCardV2 } from "@/components/job-card-v2";
import { SearchBox } from "@/components/search-box";
import { SearchFilters } from "@/components/search-filters";
import { SearchHistory } from "@/components/search-history";
import { HotSearches } from "@/components/hot-searches";
import { HighlightedText } from "@/components/highlighted-text";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Job {
  id: string;
  slug: string;
  title: string;
  description: string;
  employmentType: string;
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  location: string;
  city: string | null;
  isRemote: boolean;
  isHybrid: boolean;
  datePosted: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

interface SearchFilters {
  city: string;
  type: string;
  minSalary: string;
  maxSalary: string;
}

interface SearchPageClientProps {
  initialQuery: string;
  initialCity: string;
  initialType: string;
  initialMinSalary: string;
  initialMaxSalary: string;
  initialPage: number;
  locale?: string;
}

export function SearchPageClient({
  initialQuery,
  initialCity,
  initialType,
  initialMinSalary,
  initialMaxSalary,
  initialPage,
  locale = "zh",
}: SearchPageClientProps) {
  const isEn = locale === "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    city: initialCity,
    type: initialType,
    minSalary: initialMinSalary,
    maxSalary: initialMaxSalary,
  });
  const [page, setPage] = useState(initialPage);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  const searchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filters.city && filters.city !== "all") params.set("city", filters.city);
      if (filters.type && filters.type !== "all") params.set("type", filters.type);
      if (filters.minSalary) params.set("minSalary", filters.minSalary);
      if (filters.maxSalary) params.set("maxSalary", filters.maxSalary);
      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setJobs(data.jobs?.items ?? data.jobs ?? []);
        const jobTotal = data.jobs?.total ?? data.totalCount ?? 0;
        setTotal(jobTotal);
        const limit = data.limit ?? 20;
        setTotalPages(Math.ceil(jobTotal / limit));
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [query, filters, page]);

  const fetchCities = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs/cities");
      const data = await response.json();
      if (response.ok) {
        setCities(data.cities.filter(Boolean));
      }
    } catch (error) {
      console.error("Failed to fetch cities:", error);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    searchJobs();
  }, [searchJobs]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters.city && filters.city !== "all") params.set("city", filters.city);
    if (filters.type && filters.type !== "all") params.set("type", filters.type);
    if (filters.minSalary) params.set("minSalary", filters.minSalary);
    if (filters.maxSalary) params.set("maxSalary", filters.maxSalary);
    if (page > 1) params.set("page", page.toString());

    const url = `/search${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(url, { scroll: false });
  }, [query, filters, page, router]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const resultsLabel = isEn
    ? `${total.toLocaleString()} jobs found`
    : `共 ${total.toLocaleString()} 个职位`;

  const searchTitle = query
    ? (isEn ? `Search results for "${query}"` : `"${query}" 的搜索结果`)
    : (isEn ? "Search Jobs" : "搜索职位");

  const noResultsTitle = isEn ? "No matching jobs found" : "未找到相关职位";
  const noResultsDesc = isEn ? "Try adjusting your search keywords or filters" : "尝试调整搜索关键词或筛选条件";
  const clearFilters = isEn ? "Clear filters" : "清除筛选条件";
  const prevPage = isEn ? "Previous" : "上一页";
  const nextPage = isEn ? "Next" : "下一页";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Breadcrumb items={[{ label: isEn ? "Job Search" : "职位搜索", href: `/${locale}/search` }]} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {searchTitle}
          </h1>

          <SearchBox 
            initialValue={query}
            onSearch={handleSearch}
            placeholder={isEn ? "Search job titles, companies, keywords..." : "搜索职位名称、公司、关键词..."}
            showSuggestions={true}
          />

          {!query && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <SearchHistory onSelect={handleSearch} />
              <HotSearches onSelect={handleSearch} />
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <SearchFilters
              filters={filters}
              onChange={handleFilterChange}
              cities={cities}
              totalJobs={total}
              locale={locale}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {resultsLabel}
                {loading && (
                  <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />
                )}
              </p>
            </div>

            {loading && jobs.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse"
                  >
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{noResultsTitle}</h3>
                <p className="text-gray-500 mb-6">{noResultsDesc}</p>
                <button
                  onClick={() => {
                    setQuery("");
                    setFilters({ city: "all", type: "all", minSalary: "", maxSalary: "" });
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  {clearFilters}
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCardV2
                      key={job.id}
                      job={{
                        ...job,
                        description: (
                          <HighlightedText
                            text={job.description}
                            highlight={query}
                            maxLength={150}
                          />
                        ) as unknown as string,
                      } as any}
                      variant="compact"
                      highlightQuery={query}
                      locale={locale}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    {page > 1 && (
                      <button
                        onClick={() => setPage(page - 1)}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {prevPage}
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      {page > 3 && (
                        <>
                          <button
                            onClick={() => setPage(1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            1
                          </button>
                          {page > 4 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                        </>
                      )}

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
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-all ${
                              page === pageNum
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {page < totalPages - 2 && (
                        <>
                          {page < totalPages - 3 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setPage(totalPages)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    {page < totalPages && (
                      <button
                        onClick={() => setPage(page + 1)}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        {nextPage}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
