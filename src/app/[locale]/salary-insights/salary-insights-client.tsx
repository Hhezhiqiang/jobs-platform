"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { Header } from "@/components/header";
import { Breadcrumb } from "@/components/breadcrumb";
import { SalaryCalculator } from "./components/salary-calculator";
import { FilterSection } from "./components/filter-section";
import { OverviewCards } from "./components/overview-cards";
import { SalarySchema } from "./components/salary-schema";

interface SalaryData {
  overview: {
    totalJobs: number;
    avgSalary: number;
    medianSalary: number;
    salaryRange: { min: number; max: number };
  };
  industry: Array<{
    industry: string;
    avgSalary: number;
    count: number;
    min: number;
    max: number;
  }>;
  city: Array<{
    city: string;
    avgSalary: number;
    count: number;
    median: number;
  }>;
  trend: Array<{
    month: string;
    avgSalary: number;
    count: number;
  }>;
  jobType: Array<{
    type: string;
    avgSalary: number;
    count: number;
  }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface SalaryInsightsClientProps {
  initialData?: SalaryData;
}

export default function SalaryInsightsClient({ initialData }: SalaryInsightsClientProps) {
  const [data, setData] = useState<SalaryData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  useEffect(() => {
    if (!initialData) {
      fetchSalaryData();
    }
  }, []);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/salary-insights");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "获取数据失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 格式化薪资显示
  const formatSalary = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`;
    }
    return value.toLocaleString();
  };

  // 根据筛选过滤数据
  const getFilteredData = () => {
    if (!data) return null;

    const filtered = { ...data };

    if (selectedIndustry !== "all") {
      filtered.industry = data.industry.filter(
        (item) => item.industry === selectedIndustry
      );
    }

    if (selectedCity !== "all") {
      filtered.city = data.city.filter((item) => item.city === selectedCity);
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">加载薪资数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-800 mb-2">{error}</p>
            <button
              onClick={fetchSalaryData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!filteredData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <SalarySchema data={filteredData} />
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="mb-4">
            <Breadcrumb items={[{ label: "薪资洞察", href: "/salary-insights" }]} />
          </div>
          <h1 className="text-3xl font-bold mb-4">薪资洞察分析</h1>
          <p className="text-blue-100 max-w-2xl">
            基于平台真实职位数据，为您提供全面的薪资分析报告。了解行业薪资水平、城市薪资分布及趋势变化。
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 概览卡片 */}
        <OverviewCards data={filteredData.overview} />

        {/* 筛选器 */}
        <FilterSection
          industries={data?.industry.map((i) => i.industry) || []}
          cities={data?.city.map((c) => c.city) || []}
          selectedIndustry={selectedIndustry}
          selectedCity={selectedCity}
          onIndustryChange={setSelectedIndustry}
          onCityChange={setSelectedCity}
        />

        {/* 薪资计算器 */}
        <SalaryCalculator />

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 各行业薪资对比 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">各行业平均薪资对比</h2>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData.industry.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="industry"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatSalary(value)}
                  />
                  <Tooltip
                    formatter={(value) => [`¥${formatSalary(value as number)}/年`, "平均薪资"]}
                    labelStyle={{ color: "#374151" }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="avgSalary" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {filteredData.industry.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 各城市薪资分布 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">各城市薪资分布</h2>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData.city.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="city"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatSalary(value)}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "avgSalary") return [`¥${formatSalary(value as number)}/年`, "平均薪资"];
                      if (name === "median") return [`¥${formatSalary(value as number)}/年`, "中位数"];
                      return [value, name];
                    }}
                    labelStyle={{ color: "#374151" }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avgSalary" name="平均薪资" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="median" name="中位数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 薪资趋势图 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">薪资趋势（近6个月）</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const [year, month] = value.split("-");
                      return `${month}月`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatSalary(value)}
                  />
                  <Tooltip
                    formatter={(value) => [`¥${formatSalary(value as number)}/年`, "平均薪资"]}
                    labelFormatter={(label) => {
                      const [year, month] = label.split("-");
                      return `${year}年${month}月`;
                    }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgSalary"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 职位类型薪资对比 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">职位类型薪资对比</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData.jobType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatSalary(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value) => [`¥${formatSalary(value as number)}/年`, "平均薪资"]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="avgSalary" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                    {filteredData.jobType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 数据说明 */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">数据说明</h3>
          <ul className="text-blue-800 text-sm space-y-2">
            <li>• 数据来源：基于平台实时职位数据聚合分析</li>
            <li>• 统计范围：仅包含有明确薪资范围的职位</li>
            <li>• 更新频率：每日自动更新</li>
            <li>• 货币单位：人民币（CNY），年薪</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
