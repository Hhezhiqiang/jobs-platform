"use client";

import { useState } from "react";
import { Calculator, TrendingUp, Building2, MapPin } from "lucide-react";

interface CalculatorResult {
  estimatedSalary: number;
  salaryRange: {
    min: number;
    max: number;
    median: number;
  };
  sampleSize: number;
  confidence: number;
  currency: string;
  period: string;
}

export function SalaryCalculator() {
  const [jobTitle, setJobTitle] = useState("");
  const [experience, setExperience] = useState("3-5");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!jobTitle.trim()) {
      setError("请输入职位名称");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/salary-insights/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          experience,
          city: city || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data) {
          setResult(data.data);
        } else {
          setError(data.message || "未找到相关数据");
          setResult(null);
        }
      } else {
        setError(data.error || "计算失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Calculator className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">薪资计算器</h2>
          <p className="text-sm text-gray-500">输入职位信息，获取薪资估算</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            职位名称
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="如：前端工程师"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            工作经验
          </label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="0-1">应届/1年以下</option>
            <option value="1-3">1-3年</option>
            <option value="3-5">3-5年</option>
            <option value="5-8">5-8年</option>
            <option value="8-10">8-10年</option>
            <option value="10+">10年以上</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            城市（可选）
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="如：北京"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            计算中...
          </span>
        ) : (
          "估算薪资"
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600 mb-1">预估年薪</p>
              <p className="text-3xl font-bold text-blue-600">
                ¥{formatSalary(result.estimatedSalary)}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                置信度 {result.confidence}%
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">薪资范围</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-semibold text-gray-800">
                  ¥{formatSalary(result.salaryRange.min)}
                </span>
                <span className="text-gray-400">~</span>
                <span className="text-lg font-semibold text-gray-800">
                  ¥{formatSalary(result.salaryRange.max)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                中位数 ¥{formatSalary(result.salaryRange.median)}
              </p>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600 mb-1">参考样本</p>
              <p className="text-2xl font-bold text-gray-800">{result.sampleSize}</p>
              <p className="text-xs text-gray-500">个相关职位</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
