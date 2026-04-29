"use client";

import { useState, type ChangeEvent } from "react";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectFilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  type: "select" | "date";
  name: string;
  label?: string;
  options?: SelectFilterOption[];
  placeholder?: string;
}

export interface SearchFilterProps {
  search?: {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
  };
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (name: string, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  className?: string;
}

/**
 * 搜索筛选栏组件 — 组合搜索框、下拉筛选和日期选择
 */
export function SearchFilter({
  search,
  filters = [],
  filterValues = {},
  onFilterChange,
  onSearch,
  onReset,
  className,
}: SearchFilterProps) {
  const [localSearch, setLocalSearch] = useState(search?.value ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search?.onChange(localSearch);
    onSearch();
  };

  const handleReset = () => {
    setLocalSearch("");
    search?.onChange("");
    onReset();
  };

  const hasActiveFilters = localSearch || Object.values(filterValues).some(Boolean);

  return (
    <div className={cn("rounded-xl border border-gray-100 bg-white p-4 shadow-sm", className)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
        {search && (
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">搜索</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" value={localSearch} onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalSearch(e.target.value)} placeholder={search.placeholder} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        )}
        {filters.map((filter) => {
          const value = filterValues[filter.name] ?? "";
          if (filter.type === "select" && filter.options) {
            return (
              <div key={filter.name}>
                <label className="mb-1 block text-sm font-medium text-gray-700">{filter.label || filter.name}</label>
                <select value={value} onChange={(e) => onFilterChange?.(filter.name, e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-3 pr-8 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-40">
                  <option value="">全部</option>
                  {filter.options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
            );
          }
          if (filter.type === "date") {
            return (
              <div key={filter.name}>
                <label className="mb-1 block text-sm font-medium text-gray-700">{filter.label || filter.name}</label>
                <input type="date" value={value} onChange={(e) => onFilterChange?.(filter.name, e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 px-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-40" />
              </div>
            );
          }
          return null;
        })}
        <div className="flex gap-2">
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><Filter className="h-4 w-4" /> 筛选</button>
          <button type="button" onClick={handleReset} className={cn("inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", !hasActiveFilters && "pointer-events-none opacity-50")} disabled={!hasActiveFilters}><X className="h-4 w-4" /> 重置</button>
        </div>
      </form>
    </div>
  );
}
