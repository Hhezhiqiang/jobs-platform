import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "按城市找工作 - 热门城市招聘 | JobQuip",
  description: "浏览全国热门城市的高薪职位，按城市和职位类型精准筛选，快速找到理想工作。",
};

const JOB_TYPES = [
  { key: "FULL_TIME", label: "全职", icon: "💼" },
  { key: "PART_TIME", label: "兼职", icon: "⏰" },
  { key: "CONTRACT", label: "合同工", icon: "📝" },
  { key: "INTERNSHIP", label: "实习生", icon: "🎓" },
  { key: "FREELANCE", label: "自由职业", icon: "🏠" },
];

export default async function CitiesPage() {
  const cityCounts = await prisma.jobs.groupBy({
    by: ["city"],
    where: { status: "ACTIVE", city: { not: null }, slug: { not: "" } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const validCities = cityCounts
    .filter((c) => c.city)
    .map((c) => ({ city: c.city!, count: c._count.id }));

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            热门城市招聘
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            选择你心仪的城市和职位类型，发现更多本地高薪机会
          </p>
        </div>

        {/* 职位类型快捷入口 */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
            按职位类型
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {JOB_TYPES.map((t) => (
              <Link
                key={t.key}
                href={`/jobs?type=${t.key}`}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-full text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                <span className="text-lg">{t.icon}</span>
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 城市卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {validCities.map(({ city, count }) => (
            <div key={city} className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-400 font-medium">
                  {count} 个职位
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{city}</h3>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.slice(0, 3).map((t) => (
                  <Link
                    key={t.key}
                    href={`/jobs/city/${encodeURIComponent(city)}/${t.key}`}
                    className="text-xs px-3 py-1.5 bg-gray-50 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  >
                    {t.icon} {t.label}
                  </Link>
                ))}
                <Link
                  href={`/jobs/city/${encodeURIComponent(city)}`}
                  className="text-xs px-3 py-1.5 bg-gray-50 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  全部 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
