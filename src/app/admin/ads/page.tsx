import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // 获取所有广告位
  const adPositions = await prisma.adPosition.findMany({
    include: {
      ads: {
        where: {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              ← 返回管理首页
            </Link>
            <h1 className="text-2xl font-bold">广告管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 添加广告按钮 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <Link
            href="/admin/ads/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            + 发布新广告
          </Link>
        </div>

        {/* 广告位列表 */}
        <div className="space-y-6">
          {adPositions.map((position) => (
            <div key={position.id} className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{position.displayName}</h2>
                  <p className="text-gray-600">标识: {position.name}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    position.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {position.isActive ? "启用" : "禁用"}
                </span>
              </div>

              <div className="p-6">
                {position.ads.length === 0 ? (
                  <p className="text-gray-500">暂无广告</p>
                ) : (
                  <div className="space-y-4">
                    {position.ads.map((ad) => (
                      <div
                        key={ad.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">{ad.title}</p>
                          <p className="text-sm text-gray-600">
                            类型: {ad.type} | 状态: {ad.status}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            ad.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {ad.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
