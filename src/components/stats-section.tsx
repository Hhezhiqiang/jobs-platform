"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, Briefcase, Building2, Rocket } from "lucide-react";

interface StatCardProps {
  value: number;
  suffix?: string;
  labelKey: string;
  icon: React.ReactNode;
  gradient: string;
  delay?: number;
}

function StatCard({ value, suffix, labelKey, icon, gradient, delay = 0 }: StatCardProps) {
  const t = useTranslations("stats");
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">
        <span>{displayValue.toLocaleString()}{suffix}</span>
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
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("title")}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <StatCard value={jobCount || 0} suffix="+" labelKey="jobs" icon={<Briefcase className="w-7 h-7 text-white" />} gradient="from-blue-500 to-blue-600" delay={0} />
          <StatCard value={companyCount || 0} suffix="+" labelKey="companies" icon={<Building2 className="w-7 h-7 text-white" />} gradient="from-purple-500 to-purple-600" delay={150} />
          <StatCard value={dailyNewJobs || 0} suffix="+" labelKey="dailyNew" icon={<Rocket className="w-7 h-7 text-white" />} gradient="from-orange-500 to-orange-600" delay={300} />
        </div>
      </div>
    </section>
  );
}
