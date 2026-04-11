"use client";

import { Briefcase, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

interface OverviewData {
  totalJobs: number;
  avgSalary: number;
  medianSalary: number;
  salaryRange: { min: number; max: number };
}

interface OverviewCardsProps {
  data: OverviewData;
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const formatSalary = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`;
    }
    return value.toLocaleString();
  };

  const cards = [
    {
      icon: Briefcase,
      label: "统计职位数",
      value: data.totalJobs.toLocaleString(),
      color: "blue",
    },
    {
      icon: DollarSign,
      label: "平均年薪",
      value: `¥${formatSalary(data.avgSalary)}`,
      color: "green",
    },
    {
      icon: BarChart3,
      label: "薪资中位数",
      value: `¥${formatSalary(data.medianSalary)}`,
      color: "purple",
    },
    {
      icon: TrendingUp,
      label: "薪资区间",
      value: `¥${formatSalary(data.salaryRange.min)} - ¥${formatSalary(data.salaryRange.max)}`,
      color: "orange",
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    green: { bg: "bg-green-50", icon: "text-green-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600" },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => {
        const colors = colorClasses[card.color];
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div
                className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
