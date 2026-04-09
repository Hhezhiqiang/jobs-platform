"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface JobSearchProps {
  currentParams: {
    q?: string;
    city?: string;
    type?: string;
    minSalary?: string;
    maxSalary?: string;
  };
  cities: string[];
}

const employmentTypes = [
  { value: "FULL_TIME", label: "全职" },
  { value: "PART_TIME", label: "兼职" },
  { value: "CONTRACT", label: "合同工" },
  { value: "INTERNSHIP", label: "实习" },
  { value: "FREELANCE", label: "自由职业" },
];

export function JobSearch({ currentParams, cities }: JobSearchProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(currentParams.q || "");
  const [city, setCity] = useState(currentParams.city || "");
  const [type, setType] = useState(currentParams.type || "");
  const [minSalary, setMinSalary] = useState(currentParams.minSalary || "");
  const [maxSalary, setMaxSalary] = useState(currentParams.maxSalary || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (minSalary) params.set("minSalary", minSalary);
    if (maxSalary) params.set("maxSalary", maxSalary);
    
    router.push(`/jobs?${params.toString()}`);
  };

  const handleClear = () => {
    setKeyword("");
    setCity("");
    setType("");
    setMinSalary("");
    setMaxSalary("");
    router.push("/jobs");
  };

  const hasFilters = keyword || city || type || minSalary || maxSalary;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <h2 className="text-lg font-semibold">搜索职位</h2>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* 关键词搜索 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            关键词
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="职位、公司、关键词..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 城市筛选 */}
        {cities.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              城市
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部城市</option>
              {cities.filter(Boolean).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 职位类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            职位类型
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            {employmentTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* 薪资范围 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年薪范围 (CNY)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="最低"
              min="0"
              step="1000"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              placeholder="最高"
              min="0"
              step="1000"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            搜索
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              清除
            </button>
          )}
        </div>
      </form>

      {/* 热门搜索 */}
      <div className="pt-4 border-t">
        <p className="text-sm text-gray-500 mb-2">热门搜索：</p>
        <div className="flex flex-wrap gap-2">
          {["前端开发", "Java", "产品经理", "数据分析", "UI设计"].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setKeyword(tag);
                const params = new URLSearchParams();
                params.set("q", tag);
                if (city) params.set("city", city);
                if (type) params.set("type", type);
                router.push(`/jobs?${params.toString()}`);
              }}
              className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default JobSearch;
