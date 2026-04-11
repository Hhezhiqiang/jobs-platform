"use client";

import { MapPin, Briefcase, Banknote, Filter } from "lucide-react";

interface SearchFiltersProps {
  filters: {
    city: string;
    type: string;
    minSalary: string;
    maxSalary: string;
  };
  onChange: (filters: Partial<{
    city: string;
    type: string;
    minSalary: string;
    maxSalary: string;
  }>) => void;
  cities: string[];
  totalJobs: number;
}

const employmentTypes = [
  { value: "all", label: "全部类型" },
  { value: "FULL_TIME", label: "全职" },
  { value: "PART_TIME", label: "兼职" },
  { value: "CONTRACT", label: "合同制" },
  { value: "INTERNSHIP", label: "实习" },
  { value: "FREELANCE", label: "自由职业" },
];

const salaryRanges = [
  { value: "", label: "不限" },
  { value: "10", label: "10K 以下" },
  { value: "10-20", label: "10K - 20K" },
  { value: "20-30", label: "20K - 30K" },
  { value: "30-50", label: "30K - 50K" },
  { value: "50", label: "50K 以上" },
];

export function SearchFilters({ filters, onChange, cities, totalJobs }: SearchFiltersProps) {
  const hasActiveFilters = 
    filters.city !== "all" || 
    filters.type !== "all" || 
    filters.minSalary !== "" || 
    filters.maxSalary !== "";

  const handleSalaryChange = (value: string) => {
    if (value === "") {
      onChange({ minSalary: "", maxSalary: "" });
    } else if (value === "10") {
      onChange({ minSalary: "", maxSalary: "10000" });
    } else if (value === "50") {
      onChange({ minSalary: "50000", maxSalary: "" });
    } else {
      const [min, max] = value.split("-");
      onChange({ minSalary: min + "000", maxSalary: max + "000" });
    }
  };

  const getCurrentSalaryValue = () => {
    if (filters.minSalary === "" && filters.maxSalary === "") return "";
    if (filters.maxSalary === "10000") return "10";
    if (filters.minSalary === "50000") return "50";
    if (filters.minSalary && filters.maxSalary) {
      const min = parseInt(filters.minSalary) / 1000;
      const max = parseInt(filters.maxSalary) / 1000;
      return `${min}-${max}`;
    }
    return "";
  };

  const clearFilters = () => {
    onChange({
      city: "all",
      type: "all",
      minSalary: "",
      maxSalary: "",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">筛选条件</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              清除全部
            </button>
          )}
        </div>

        {/* 城市筛选 */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <MapPin className="w-4 h-4" />
            工作地点
          </label>
          <select
            value={filters.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          >
            <option value="all">全部城市</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* 职位类型筛选 */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Briefcase className="w-4 h-4" />
            职位类型
          </label>
          <select
            value={filters.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          >
            {employmentTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* 薪资范围筛选 */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Banknote className="w-4 h-4" />
            薪资范围
          </label>
          <select
            value={getCurrentSalaryValue()}
            onChange={(e) => handleSalaryChange(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          >
            {salaryRanges.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>

        {/* 统计信息 */}
        <div className="pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            找到 <span className="font-semibold text-gray-900">{totalJobs.toLocaleString()}</span> 个职位
          </p>
        </div>
      </div>
    </div>
  );
}
