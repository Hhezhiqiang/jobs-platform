"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, BarChart3, TrendingUp, MapPin, Briefcase } from "lucide-react";

export default function SalaryComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState("zh");
  const [selectedCity, setSelectedCity] = useState("北京");
  const [selectedRole, setSelectedRole] = useState("前端工程师");

  useEffect(() => {
    params.then(p => setLocale(p.locale));
    setLoading(false);
  }, []);

  const isEn = locale === "en";

  // 模拟薪资数据（实际应从 API 获取）
  const salaryData: Record<string, Record<string, { min: number; mid: number; max: number }>> = {
    "前端工程师": {
      "北京": { min: 12, mid: 22, max: 40 },
      "上海": { min: 11, mid: 20, max: 38 },
      "深圳": { min: 11, mid: 21, max: 36 },
      "杭州": { min: 10, mid: 18, max: 32 },
      "成都": { min: 8, mid: 14, max: 25 },
      "远程": { min: 10, mid: 18, max: 35 },
    },
    "后端工程师": {
      "北京": { min: 14, mid: 24, max: 45 },
      "上海": { min: 13, mid: 22, max: 42 },
      "深圳": { min: 13, mid: 23, max: 40 },
      "杭州": { min: 11, mid: 19, max: 35 },
      "成都": { min: 9, mid: 15, max: 28 },
      "远程": { min: 11, mid: 19, max: 38 },
    },
    "全栈工程师": {
      "北京": { min: 15, mid: 26, max: 48 },
      "上海": { min: 14, mid: 24, max: 45 },
      "深圳": { min: 14, mid: 25, max: 42 },
      "杭州": { min: 12, mid: 21, max: 38 },
      "成都": { min: 10, mid: 16, max: 30 },
      "远程": { min: 12, mid: 21, max: 40 },
    },
    "产品经理": {
      "北京": { min: 13, mid: 23, max: 42 },
      "上海": { min: 12, mid: 21, max: 40 },
      "深圳": { min: 12, mid: 22, max: 38 },
      "杭州": { min: 11, mid: 19, max: 35 },
      "成都": { min: 9, mid: 15, max: 28 },
      "远程": { min: 11, mid: 19, max: 36 },
    },
    "数据工程师": {
      "北京": { min: 15, mid: 25, max: 50 },
      "上海": { min: 14, mid: 23, max: 48 },
      "深圳": { min: 14, mid: 24, max: 45 },
      "杭州": { min: 12, mid: 20, max: 38 },
      "成都": { min: 10, mid: 16, max: 30 },
      "远程": { min: 12, mid: 20, max: 42 },
    },
  };

  const roles = Object.keys(salaryData);
  const cities = ["北京", "上海", "深圳", "杭州", "成都", "远程"];
  const data = salaryData[selectedRole]?.[selectedCity] || { min: 0, mid: 0, max: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            {isEn ? "Salary Comparison" : "薪资对比"}
          </h1>
          <p className="text-gray-500 mt-1">{isEn ? "Compare salaries across cities and roles" : "对比不同城市和岗位的薪资水平"}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {isEn ? "Role" : "岗位"}
              </label>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => (
                  <button key={role} onClick={() => setSelectedRole(role)} className={`px-3 py-1.5 rounded-full text-sm transition ${selectedRole === role ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {isEn ? "City" : "城市"}
              </label>
              <div className="flex flex-wrap gap-2">
                {cities.map(city => (
                  <button key={city} onClick={() => setSelectedCity(city)} className={`px-3 py-1.5 rounded-full text-sm transition ${selectedCity === city ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Salary Display */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedCity} · {selectedRole} {isEn ? "(K/month)" : "(K/月)"}
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">{isEn ? "Junior" : "初级"}</div>
              <div className="text-3xl font-bold text-blue-600">{data.min}K</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">{isEn ? "Mid" : "中级"}</div>
              <div className="text-3xl font-bold text-green-600">{data.mid}K</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">{isEn ? "Senior" : "高级"}</div>
              <div className="text-3xl font-bold text-purple-600">{data.max}K</div>
            </div>
          </div>
          {/* Bar chart */}
          <div className="mt-6 space-y-3">
            {[
              { label: isEn ? "Junior" : "初级", value: data.min, color: "bg-blue-500" },
              { label: isEn ? "Mid" : "中级", value: data.mid, color: "bg-green-500" },
              { label: isEn ? "Senior" : "高级", value: data.max, color: "bg-purple-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-12 text-right">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div className={`${item.color} h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium transition-all`} style={{ width: `${Math.max((item.value / 50) * 100, 8)}%` }}>
                    {item.value}K
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* City comparison */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            {isEn ? "All Cities Comparison" : "各城市对比"}
          </h3>
          <div className="space-y-2">
            {cities.map(city => {
              const d = salaryData[selectedRole]?.[city];
              if (!d) return null;
              return (
                <div key={city} className={`flex items-center gap-4 p-3 rounded-lg ${city === selectedCity ? "bg-blue-50 border border-blue-200" : ""}`}>
                  <span className="w-12 text-sm font-medium text-gray-900">{city}</span>
                  <div className="flex-1 grid grid-cols-3 gap-2 text-center text-sm">
                    <span className="text-blue-600">{d.min}K</span>
                    <span className="text-green-600">{d.mid}K</span>
                    <span className="text-purple-600">{d.max}K</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
