import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MapPin } from "lucide-react";

const VALID_CITIES = [
  "北京", "上海", "深圳", "杭州", "广州",
  "成都", "武汉", "西安", "南京", "苏州",
];

export const metadata: Metadata = {
  title: "按城市找工作 - 热门城市招聘",
  description: "浏览热门城市的高薪职位，快速找到理想工作。",
};

export default async function CitiesPage() {
  const cityCounts = await prisma.jobs.groupBy({
    by: ["city"],
    where: { status: "ACTIVE", slug: { not: "" } },
    _count: { id: true },
  });

  const countMap = new Map(
    cityCounts.map((c) => [c.city, c._count.id])
  );

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            热门城市招聘
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            选择你心仪的城市，发现更多本地高薪机会
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {VALID_CITIES.map((city) => {
            const count = countMap.get(city) || 0;
            return (
              <Link
                key={city}
                href={`/jobs/city/${encodeURIComponent(city)}`}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">
                    {count} 个职位
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{city}</h3>
                <p className="text-sm text-gray-500">查看 {city} 最新招聘</p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
