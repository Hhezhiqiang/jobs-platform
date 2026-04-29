"use client";
import { useState, useCallback } from "react";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
export interface FilterOption { label: string; value: string; }
export interface AdminSearchBarProps { value: string; onChange: (value: string) => void; placeholder?: string; filters?: FilterOption[]; onSearch?: (value: string, activeFilter?: string) => void; onReset?: () => void; className?: string; }
export function AdminSearchBar({ value, onChange, placeholder = "搜索...", filters, onSearch, onReset, className }: AdminSearchBarProps) {
  const [activeFilter, setActiveFilter] = useState<string | undefined>(filters?.[0]?.value);
  const handleSearch = useCallback(() => onSearch?.(value, activeFilter), [onSearch, value, activeFilter]);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };
  const handleReset = () => { onChange(""); setActiveFilter(filters?.[0]?.value); onReset?.(); };
  const hasActive = value !== "" || (activeFilter && filters && activeFilter !== filters[0]?.value);
  return (<div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>{filters && filters.length > 0 && (<div className="relative"><Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">{filters.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}</select></div>)}<div className="flex items-center gap-2"><button onClick={handleSearch} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">搜索</button>{hasActive && (<button onClick={handleReset} className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"><X className="h-3.5 w-3.5" /> 重置</button>)}</div></div>);
}
