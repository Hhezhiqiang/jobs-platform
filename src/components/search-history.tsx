"use client";

import { useState, useEffect } from "react";
import { Clock, X, Search } from "lucide-react";

interface SearchHistoryProps {
  onSelect: (term: string) => void;
  limit?: number;
}

const SEARCH_HISTORY_KEY = "job_search_history";

export function SearchHistory({ onSelect, limit = 8 }: SearchHistoryProps) {
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // parse failed
      }
    }
    return [];
  });

  const removeItem = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter((h) => h !== term);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const clearAll = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setHistory([]);
  };

  if (history.length === 0) {
    return null;
  }

  const displayHistory = history.slice(0, limit);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">最近搜索</span>
        </div>
        <button
          onClick={clearAll}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          清除
        </button>
      </div>
      <div className="p-2">
        <div className="flex flex-wrap gap-2">
          {displayHistory.map((term) => (
            <div
              key={term}
              className="group flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
              onClick={() => onSelect(term)}
            >
              <Search className="w-3 h-3 opacity-50" />
              <span className="max-w-[150px] truncate">{term}</span>
              <button
                onClick={(e) => removeItem(term, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
