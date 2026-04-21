"use client";

import { useState } from "react";
import { Search, MapPin, Briefcase, DollarSign, X, SlidersHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CULTURE_TAGS, type CultureTag } from "./job-preference-modal";
import { useTranslations } from "next-intl";

interface FilterSidebarV2Props {
  currentParams: {
    q?: string;
    city?: string;
    type?: string;
    minSalary?: string;
    maxSalary?: string;
    cultureTag?: string;
    onlyMatched?: string;
  };
  cities: string[];
  totalJobs: number;
  userCultureTags?: CultureTag[];
  hasPreferences?: boolean;
  onToggleOnlyMatched?: () => void;
}

const jobTypes = [
  { value: "FULL_TIME", labelKey: "filter.jobTypes.fullTime", icon: "💼" },
  { value: "PART_TIME", labelKey: "filter.jobTypes.partTime", icon: "⏰" },
  { value: "INTERNSHIP", labelKey: "filter.jobTypes.internship", icon: "🎓" },
  { value: "CONTRACT", labelKey: "filter.jobTypes.contract", icon: "📝" },
  { value: "FREELANCE", labelKey: "filter.jobTypes.freelance", icon: "🏠" },
];

const salaryRanges = [
  { min: "0", max: "10000", labelKey: "filter.salary.below10" },
  { min: "10000", max: "20000", labelKey: "filter.salary.10to20" },
  { min: "20000", max: "30000", labelKey: "filter.salary.20to30" },
  { min: "30000", max: "50000", labelKey: "filter.salary.30to50" },
  { min: "50000", max: "", labelKey: "filter.salary.above50" },
];

function buildFilterUrl(
  baseUrl: string,
  currentParams: FilterSidebarV2Props["currentParams"],
  newParams: Partial<FilterSidebarV2Props["currentParams"]>
): string {
  const params = new URLSearchParams();
  const mergedParams = { ...currentParams, ...newParams };
  if (mergedParams.q) params.set("q", mergedParams.q);
  if (mergedParams.city) params.set("city", mergedParams.city);
  if (mergedParams.type) params.set("type", mergedParams.type);
  if (mergedParams.minSalary) params.set("minSalary", mergedParams.minSalary);
  if (mergedParams.maxSalary) params.set("maxSalary", mergedParams.maxSalary);
  if (mergedParams.cultureTag) params.set("cultureTag", mergedParams.cultureTag);
  if (mergedParams.onlyMatched) params.set("onlyMatched", mergedParams.onlyMatched);
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function FilterSidebarV2({
  currentParams,
  cities,
  totalJobs,
  userCultureTags = [],
  hasPreferences = false,
  onToggleOnlyMatched,
}: FilterSidebarV2Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasFilters = Object.values(currentParams).some(Boolean);
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "zh" : "zh";
  const baseUrl = `/${locale}/jobs`;
  const onlyMatchedActive = currentParams.onlyMatched === "true";
  const t = useTranslations("filter");

  return (
    <>
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm"
        >
          <span className="flex items-center gap-2 font-medium text-gray-700">
            <SlidersHorizontal className="w-4 h-4" />
            {t("filters")}
            {hasFilters && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
          </span>
          <span className="text-sm text-gray-500">{totalJobs.toLocaleString()} {t("jobsCount")}</span>
        </button>

        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-gray-50 z-50 shadow-xl overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg">{t("filter")}</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterContentPanel
                currentParams={currentParams}
                cities={cities}
                totalJobs={totalJobs}
                baseUrl={baseUrl}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
                hasFilters={hasFilters}
                userCultureTags={userCultureTags}
                hasPreferences={hasPreferences}
                onToggleOnlyMatched={onToggleOnlyMatched}
                onlyMatchedActive={onlyMatchedActive}
              />
            </div>
          </>
        )}
      </div>

      <div className="hidden lg:block">
        <FilterContentPanel
          currentParams={currentParams}
          cities={cities}
          totalJobs={totalJobs}
          baseUrl={baseUrl}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          hasFilters={hasFilters}
          userCultureTags={userCultureTags}
          hasPreferences={hasPreferences}
          onToggleOnlyMatched={onToggleOnlyMatched}
          onlyMatchedActive={onlyMatchedActive}
        />
      </div>
    </>
  );
}

function FilterContentPanel({
  currentParams,
  cities,
  totalJobs,
  baseUrl,
  isExpanded,
  setIsExpanded,
  hasFilters,
  userCultureTags,
  hasPreferences,
  onToggleOnlyMatched,
  onlyMatchedActive,
}: {
  currentParams: FilterSidebarV2Props["currentParams"];
  cities: string[];
  totalJobs: number;
  baseUrl: string;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
  hasFilters: boolean;
  userCultureTags: CultureTag[];
  hasPreferences: boolean;
  onToggleOnlyMatched?: () => void;
  onlyMatchedActive: boolean;
}) {
  const t = useTranslations("filter");

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          {t("searchJobs")}
        </h3>
        <form action={baseUrl} className="space-y-3">
          {currentParams.city && <input type="hidden" name="city" value={currentParams.city} />}
          {currentParams.type && <input type="hidden" name="type" value={currentParams.type} />}
          {currentParams.minSalary && <input type="hidden" name="minSalary" value={currentParams.minSalary} />}
          {currentParams.maxSalary && <input type="hidden" name="maxSalary" value={currentParams.maxSalary} />}
          {currentParams.cultureTag && <input type="hidden" name="cultureTag" value={currentParams.cultureTag} />}
          {onlyMatchedActive && <input type="hidden" name="onlyMatched" value="true" />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={currentParams.q}
              placeholder={t("keywords")}
              aria-label={t("searchJobs")}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg"
          >
            {t("search")}
          </button>
        </form>
      </div>

      {/* 筛选条件 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            {t("filters")}
            {hasFilters && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                {t("active")}
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
            {/* 只显示文化契合职位开关 */}
            {hasPreferences && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{t("cultureMatch")}</p>
                      <p className="text-xs text-gray-500">{t("cultureMatchSub")}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={onlyMatchedActive}
                      onChange={onToggleOnlyMatched}
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full peer transition-all",
                      onlyMatchedActive ? "bg-green-500" : "bg-gray-200"
                    )}>
                      <div className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                        onlyMatchedActive && "translate-x-5"
                      )} />
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* 公司文化标签筛选 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                {t("companyCulture")}
              </h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildFilterUrl(baseUrl, currentParams, { cultureTag: undefined })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                    !currentParams.cultureTag ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {t("all")}
                </a>
                {CULTURE_TAGS.map((tag) => (
                  <a
                    key={tag.id}
                    href={buildFilterUrl(baseUrl, currentParams, { cultureTag: tag.id })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all inline-flex items-center gap-1",
                      currentParams.cultureTag === tag.id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                    title={tag.description}
                  >
                    {tag.icon} {tag.label}
                  </a>
                ))}
              </div>
            </div>

            {/* 城市筛选 */}
            {cities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t("location")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={buildFilterUrl(baseUrl, currentParams, { city: undefined })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all",
                      !currentParams.city ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {t("all")}
                  </a>
                  {cities.filter(Boolean).map((city) => (
                    <a
                      key={city}
                      href={buildFilterUrl(baseUrl, currentParams, { city })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-all",
                        currentParams.city === city ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{t("jobType")}</h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildFilterUrl(baseUrl, currentParams, { type: undefined })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                    !currentParams.type ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {t("all")}
                </a>
                {jobTypes.map((type) => (
                  <a
                    key={type.value}
                    href={buildFilterUrl(baseUrl, currentParams, { type: type.value })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all",
                      currentParams.type === type.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {type.icon} {t(type.labelKey)}
                  </a>
                ))}
              </div>
            </div>

            {/* 薪资范围 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {t("salaryRange")}
              </h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildFilterUrl(baseUrl, currentParams, { minSalary: undefined, maxSalary: undefined })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                    !currentParams.minSalary && !currentParams.maxSalary ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {t("all")}
                </a>
                {salaryRanges.map((range) => (
                  <a
                    key={range.labelKey}
                    href={buildFilterUrl(baseUrl, currentParams, { minSalary: range.min, maxSalary: range.max || undefined })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all",
                      currentParams.minSalary === range.min ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {t(range.labelKey)}
                  </a>
                ))}
              </div>
            </div>

            {/* 清除筛选 */}
            {hasFilters && (
              <a
                href={baseUrl}
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {t("clearFilters")}
              </a>
            )}
          </div>
        )}
      </div>

      {/* 结果统计 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <p className="text-blue-100 mb-1">{t("currentResults")}</p>
        <p className="text-3xl font-bold">{totalJobs.toLocaleString()}</p>
        <p className="text-blue-100">{t("jobsCount")}</p>
        {hasPreferences && (
          <p className="mt-3 pt-3 border-t border-white/20 text-sm text-blue-100">
            {t("preferencesSet")} {userCultureTags.length} {t("preferencesSetSuffix", { count: userCultureTags.length })}
          </p>
        )}
      </div>
    </div>
  );
}
