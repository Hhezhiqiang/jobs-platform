"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";

interface HotSearchesProps {
  onSelect: (term: string) => void;
  limit?: number;
}

interface HotQuery {
  term: string;
  count: number;
}

export function HotSearches({ onSelect, limit = 8 }: HotSearchesProps) {
  const [hotQueries, setHotQueries] = useState<HotQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotSearches();
  }, []);

  const fetchHotSearches = async () => {
    try {
      const response = await fetch(`/api/search/hot?limit=${limit}`);
      const data = await response.json();
      if (response.ok) {
        setHotQueries(data.hotQueries);
      }
    } catch {
      console.error("Failed to fetch hot searches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">热门搜索</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-16 h-8 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hotQueries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">热门搜索</span>
        </div>
      </div>
      <div className="p-2">
        <div className="flex flex-wrap gap-2">
          {hotQueries.map((query, index) => (
            <button
              key={query.term}
              onClick={() => onSelect(query.term)}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-orange-50 rounded-lg text-sm text-gray-700 hover:text-orange-600 transition-colors"
            >
              <span
                className={`w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold ${
                  index < 3
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {index + 1}
              </span>
              <span className="max-w-[120px] truncate">{query.term}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
