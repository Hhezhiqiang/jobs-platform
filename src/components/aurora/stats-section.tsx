import { TrendingUp, Users, Building2, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface StatsSectionProps {
  jobCount: number;
  companyCount: number;
  dailyNewJobs: number;
}

export function AuroraStatsSection({ jobCount, companyCount, dailyNewJobs }: StatsSectionProps) {
  const t = useTranslations();
  const stats = [
    {
      icon: TrendingUp,
      label: t("statsSection.jobs"),
      value: jobCount.toLocaleString(),
      color: "from-[#6366f1] to-[#8b5cf6]",
      bgColor: "bg-[#eef2ff]",
    },
    {
      icon: Building2,
      label: t("statsSection.companies"),
      value: companyCount.toLocaleString(),
      color: "from-[#06b6d4] to-[#0891b2]",
      bgColor: "bg-[#ecfeff]",
    },
    {
      icon: Clock,
      label: t("statsSection.dailyNew"),
      value: dailyNewJobs.toString(),
      color: "from-[#f59e0b] to-[#d97706]",
      bgColor: "bg-[#fffbeb]",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:shadow-[#6366f1]/5 transition-all duration-300"
            >
              {/* Aurora gradient bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
              
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text`} style={{ color: `var(--aurora-600)` }} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
