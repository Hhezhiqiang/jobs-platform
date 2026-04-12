"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, TrendingUp, Sparkles } from "lucide-react";

interface SearchBoxProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
  size?: "sm" | "md" | "lg";
}

const SEARCH_HISTORY_KEY = "job_search_history";
const MAX_HISTORY = 10;

export function SearchBox({
  initialValue = "",
  onSearch,
  placeholder = "搜索职位...",
  showSuggestions = true,
  autoFocus = false,
  size = "md",
}: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [hotSearches, setHotSearches] = useState<{ term: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 从 localStorage 加载搜索历史
  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse search history:", e);
      }
    }
  }, []);

  // 保存搜索历史
  const saveHistory = useCallback((newHistory: string[]) => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  }, []);

  // 添加搜索历史
  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...history.filter((h) => h !== term)].slice(0, MAX_HISTORY);
    saveHistory(newHistory);
  }, [history, saveHistory]);

  // 删除历史记录
  const removeFromHistory = useCallback((term: string) => {
    const newHistory = history.filter((h) => h !== term);
    saveHistory(newHistory);
  }, [history, saveHistory]);

  // 清除所有历史
  const clearHistory = useCallback(() => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setHistory([]);
  }, []);

  // 获取搜索建议
  const fetchSuggestions = useCallback(async (term: string) => {
    if (!term.trim() || !showSuggestions) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(term)}&limit=8`);
      const data = await response.json();
      if (response.ok) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  }, [showSuggestions]);

  // 获取热门搜索
  const fetchHotSearches = useCallback(async () => {
    try {
      const response = await fetch("/api/search/hot?limit=6");
      const data = await response.json();
      if (response.ok) {
        setHotSearches(data.hotQueries);
      }
    } catch (error) {
      console.error("Failed to fetch hot searches:", error);
    }
  }, []);

  // 防抖获取建议
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  // 获取热门搜索（仅在首次聚焦且为空时）
  useEffect(() => {
    if (showDropdown && !query.trim() && hotSearches.length === 0) {
      fetchHotSearches();
    }
  }, [showDropdown, query, hotSearches.length, fetchHotSearches]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.trim() ? suggestions : [...history, ...hotSearches.map((h) => h.term)];

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && items[activeIndex]) {
          handleSelect(items[activeIndex]);
        } else {
          handleSubmit();
        }
        break;
      case "Escape":
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  // 执行搜索
  const handleSubmit = () => {
    const trimmed = query.trim();
    if (trimmed) {
      addToHistory(trimmed);
    }
    setShowDropdown(false);
    onSearch(trimmed);
  };

  // 选择建议或历史
  const handleSelect = (term: string) => {
    setQuery(term);
    addToHistory(term);
    setShowDropdown(false);
    onSearch(term);
  };

  // 尺寸样式
  const sizeStyles = {
    sm: {
      input: "h-10 text-sm pl-10 pr-10",
      icon: "w-4 h-4 left-3",
      clear: "w-8 h-8 right-1",
    },
    md: {
      input: "h-12 text-base pl-12 pr-12",
      icon: "w-5 h-5 left-4",
      clear: "w-10 h-10 right-1",
    },
    lg: {
      input: "h-14 text-lg pl-14 pr-14",
      icon: "w-6 h-6 left-4",
      clear: "w-12 h-12 right-1",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${styles.icon}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all ${styles.input}`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ${styles.clear}`}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* 下拉框 */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
        >
          {/* 搜索建议 */}
          {query.trim() && suggestions.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                搜索建议
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => handleSelect(suggestion)}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                    activeIndex === index
                      ? "bg-blue-50 text-blue-600"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-gray-400" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* 搜索历史 */}
          {!query.trim() && history.length > 0 && (
            <div className="py-2 border-b border-gray-100 last:border-0">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  搜索历史
                </span>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  清除全部
                </button>
              </div>
              {history.map((item, index) => (
                <div
                  key={item}
                  className={`group flex items-center justify-between px-4 py-2.5 transition-colors ${
                    activeIndex === index
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => handleSelect(item)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{item}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 热门搜索 */}
          {!query.trim() && hotSearches.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                热门搜索
              </div>
              {hotSearches.map((item, index) => (
                <button
                  key={item.term}
                  onClick={() => handleSelect(item.term)}
                  className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors ${
                    activeIndex === history.length + index
                      ? "bg-blue-50 text-blue-600"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                        index < 3
                          ? "bg-orange-100 text-orange-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span>{item.term}</span>
                  </div>
                  <span className="text-xs text-gray-400">{item.count} 次搜索</span>
                </button>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {!query.trim() && history.length === 0 && hotSearches.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>开始搜索职位...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
