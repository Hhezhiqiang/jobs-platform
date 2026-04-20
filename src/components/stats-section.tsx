"use client";

import { useTranslations } from "next-intl";

interface StatCardProps {
  value: number;
  suffix?: string;
  labelKey: string;
  icon: string;
  color?: "blue" | "green" | "purple" | "orange";
}

function StatCard({ value, suffix, labelKey, icon, color = "blue" }: StatCardProps) {
  const t = useTranslations("stats");
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/25",
    green: "from-green-500 to-green-600 shadow-green-500/25",
    purple: "from-purple-500 to-purple-600 shadow-purple-500/25",
    orange: "from-orange-500 to-orange-600 shadow-orange-500/25",
  };

  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div className={`absolute -top-3 -right-3 w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">
        <span>{value.toLocaleString()}{suffix}</span>
      </div>
      <div className="text-gray-500 font-medium">{t(labelKey)}</div>
    </div>
  );
}

interface StatsSectionProps {
  jobCount: number;
  companyCount: number;
  dailyNewJobs?: number;
}

export function StatsSection({ jobCount, companyCount, dailyNewJobs = 0 }: StatsSectionProps) {
  const t = useTranslations("stats");

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("title")}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <StatCard value={jobCount || 0} suffix="+" labelKey="jobs" icon="💼" color="blue" />
          <StatCard value={companyCount || 0} suffix="+" labelKey="companies" icon="🏢" color="purple" />
          <StatCard value={dailyNewJobs || 0} suffix="+" labelKey="dailyNew" icon="🚀" color="orange" />
        </div>
      </div>
    </section>
  );
}
