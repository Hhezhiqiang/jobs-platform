"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  MapPin,
  Users,
  Eye,
  Clock,
  BarChart3,
  PieChart,
  TrendingUp,
} from "lucide-react";

// 简单的数据展示组件，不使用 Chart.js 避免 SSR 问题
interface GeoData {
  summary: {
    totalViews: number;
    uniqueCountries: number;
    uniqueIps: number;
    period: string;
  };
  countries: Array<{
    country: string;
    count: number;
    uniqueIps: number;
    percentage: string;
  }>;
  cities: Array<{
    city: string;
    country: string;
    count: number;
    uniqueIps: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    country: string;
    count: number;
  }>;
  topCitiesByCountry: Array<{
    country: string;
    cities: Array<{ name: string; count: number }>;
  }>;
}

// 进度条组件
function ProgressBar({ percentage }: { percentage: string }) {
  const numericValue = parseFloat(percentage);
  return (
    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(numericValue, 100)}%` }}
      />
    </div>
  );
}

// 简单的柱状图组件（纯 CSS）
function SimpleBarChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-full flex items-end gap-2 px-4">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">{item.value.toLocaleString()}</span>
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{
                height: `${(item.value / maxValue) * 200}px`,
                backgroundColor: item.color,
                minHeight: '20px'
              }}
            />
          </div>
          <span className="text-xs text-gray-600 text-center truncate w-full" title={item.label}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// 简单的饼图组件（纯 CSS/SVG）
function SimplePieChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const slices = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    // 计算 SVG 路径
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    
    return {
      ...item,
      path: `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`,
      percentage: ((item.value / total) * 100).toFixed(1)
    };
  });
  
  return (
    <div className="flex items-center gap-8">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {slices.map((slice, index) => (
          <path
            key={index}
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
        <circle cx="100" cy="100" r="40" fill="white" />
      </svg>
      <div className="space-y-2">
        {slices.map((slice, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-sm text-gray-600">{slice.label}</span>
            <span className="text-sm font-medium text-gray-900">{slice.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GeoAnalyticsClient() {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGeoData();
  }, [days]);

  const fetchGeoData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/analytics/geo?days=${days}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Geo data fetch error:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500">加载地理位置数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="text-center">
          <p className="text-red-500 mb-4">加载失败: {error}</p>
          <button
            onClick={fetchGeoData}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.countries.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="text-center text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>暂无地理位置数据</p>
          <p className="text-sm text-gray-400 mt-2">请确保有访问记录并已配置地理位置解析</p>
        </div>
      </div>
    );
  }

  // 准备图表数据
  const countryChartData = data.countries.slice(0, 10).map((c, i) => ({
    label: c.country,
    value: c.count,
    color: [
      "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
      "#ec4899", "#0ea5e9", "#6366f1", "#14b8a6", "#f97316"
    ][i] || "#6b7280"
  }));

  const pieChartData = data.countries.slice(0, 8).map((c, i) => ({
    label: c.country,
    value: c.count,
    color: [
      "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
      "#ec4899", "#0ea5e9", "#6366f1"
    ][i] || "#6b7280"
  }));

  return (
    <div className="space-y-6">
      {/* 时间范围选择 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">时间范围</span>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  days === d
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d}天
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">总访问量</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.summary.totalViews.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">近{data.summary.period}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">覆盖国家/地区</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.summary.uniqueCountries}
              </p>
              <p className="text-sm text-gray-400 mt-1">全球分布</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">独立IP数</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.summary.uniqueIps.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">去重统计</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 国家柱状图 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900">TOP10 国家/地区访问排行</h3>
          </div>
          <div className="h-64">
            <SimpleBarChart data={countryChartData} />
          </div>
        </div>

        {/* 饼图 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900">国家/地区分布占比</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <SimplePieChart data={pieChartData} />
          </div>
        </div>
      </div>

      {/* 国家详细列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900">国家/地区详细统计</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">排名</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">国家/地区</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">访问量</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">占比</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">独立IP数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.countries.map((country, index) => (
                <tr key={country.country} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {index < 3 ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-gray-200 text-gray-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {index + 1}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium ml-2">{index + 1}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCountryFlag(country.country)}</span>
                      <span className="font-medium text-gray-900">{country.country}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {country.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ProgressBar percentage={country.percentage} />
                      <span className="text-sm text-gray-500">{country.percentage}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {country.uniqueIps.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 城市统计 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900">TOP50 城市访问排行</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">排名</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">城市</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">国家/地区</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">访问量</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">独立IP数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.cities.map((city, index) => (
                <tr key={`${city.city}-${city.country}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{city.city}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(city.country)}</span>
                      <span className="text-gray-500">{city.country}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {city.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {city.uniqueIps.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 各国TOP城市 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-gray-900">各国TOP5城市分布</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topCitiesByCountry.map((item) => (
            <div key={item.country} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{getCountryFlag(item.country)}</span>
                <span className="font-bold text-gray-900">{item.country}</span>
              </div>
              <div className="space-y-2">
                {item.cities.map((city, idx) => (
                  <div key={city.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                      <span className="text-sm text-gray-700">{city.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {city.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 国家emoji标志映射
function getCountryFlag(country: string): string {
  const flagMap: Record<string, string> = {
    "China": "🇨🇳",
    "United States": "🇺🇸",
    "USA": "🇺🇸",
    "Japan": "🇯🇵",
    "South Korea": "🇰🇷",
    "Korea": "🇰🇷",
    "Singapore": "🇸🇬",
    "Hong Kong": "🇭🇰",
    "Taiwan": "🇹🇼",
    "United Kingdom": "🇬🇧",
    "UK": "🇬🇧",
    "Germany": "🇩🇪",
    "France": "🇫🇷",
    "Canada": "🇨🇦",
    "Australia": "🇦🇺",
    "India": "🇮🇳",
    "Russia": "🇷🇺",
    "Brazil": "🇧🇷",
    "Thailand": "🇹🇭",
    "Vietnam": "🇻🇳",
    "Malaysia": "🇲🇾",
    "Indonesia": "🇮🇩",
    "Philippines": "🇵🇭",
    "Netherlands": "🇳🇱",
    "Spain": "🇪🇸",
    "Italy": "🇮🇹",
    "Switzerland": "🇨🇭",
    "Sweden": "🇸🇪",
    "Norway": "🇳🇴",
    "Denmark": "🇩🇰",
    "Finland": "🇫🇮",
    "Poland": "🇵🇱",
    "Turkey": "🇹🇷",
    "UAE": "🇦🇪",
    "Saudi Arabia": "🇸🇦",
    "Israel": "🇮🇱",
    "Mexico": "🇲🇽",
    "Argentina": "🇦🇷",
    "Chile": "🇨🇱",
    "New Zealand": "🇳🇿",
    "South Africa": "🇿🇦",
    "Egypt": "🇪🇬",
    "Nigeria": "🇳🇬",
    "Kenya": "🇰🇪",
    "Local": "🏠",
    "Unknown": "🌍",
  };
  return flagMap[country] || "🌐";
}
