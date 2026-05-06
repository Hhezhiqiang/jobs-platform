"use client"
import { useLocale } from "next-intl";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logger } from '@/lib/logger';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  today: {
    clicks: number;
    registers: number;
    orders: number;
    gmv: number;
    commission: number;
  };
  total: {
    clicks: number;
    registers: number;
    orders: number;
    gmv: number;
    commission: number;
  };
  trend: { date: string; commission: number }[];
  balances: {
    available: number;
    frozen: number;
    withdrawn: number;
  };
}

export default function PromoterDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/promoter/dashboard", { credentials: "include" });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else if (res.status === 401) {
        router.push(`/${locale}/auth/login`);
      } else {
        router.push(`/${locale}/promoter/login`);
      }
    } catch (e) {
      logger.error(e);
      router.push(`/${locale}/promoter/login`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm h-80 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600">
        数据加载失败，请刷新重试
      </div>
    );
  }

  const balanceCards = [
    { label: "可提现余额", value: data.balances.available, suffix: "USDT", color: "text-green-600", bg: "bg-green-50" },
    { label: "冻结中", value: data.balances.frozen, suffix: "USDT", color: "text-orange-600", bg: "bg-orange-50" },
    { label: "累计收益", value: data.total.commission, suffix: "USDT", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "已提现", value: data.balances.withdrawn, suffix: "USDT", color: "text-gray-600", bg: "bg-gray-50" },
  ];

  const statCards = [
    { label: "今日注册", value: data.today.registers },
    { label: "今日订单", value: data.today.orders },
    { label: "今日 GMV", value: data.today.gmv, prefix: "$" },
    { label: "今日佣金", value: data.today.commission, prefix: "$" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">数据看板</h1>

      {/* 余额卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {balanceCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>
              {card.value.toFixed(2)} {card.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* 今日数据 + 累计数据 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">今日数据</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">
                  {stat.prefix || ""}{stat.value.toFixed(stat.value % 1 === 0 ? 0 : 2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">累计数据</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">总点击</span>
              <span className="font-medium">{data.total.clicks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">总注册</span>
              <span className="font-medium">{data.total.registers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">总订单</span>
              <span className="font-medium">{data.total.orders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">总 GMV</span>
              <span className="font-medium">${data.total.gmv.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 趋势图 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">近30天佣金趋势</h2>
        <div className="h-80">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => [`${Number(value).toFixed(4)} USDT`, "佣金"]} />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-gray-50 rounded-lg animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
