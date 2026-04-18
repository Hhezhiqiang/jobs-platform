import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdStatus } from "@prisma/client";

async function toggleAdStatus(formData: FormData) {
  "use server";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") return;
    const adId = formData.get("adId") as string;
    const status = formData.get("status") as AdStatus;
    await prisma.ads.update({ where: { id: adId }, data: { status } });
  } catch (error) {
    console.error("Toggle ad status error:", error);
  }
}

async function deleteAd(formData: FormData) {
  "use server";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") return;
    const adId = formData.get("adId") as string;
    await prisma.ads.delete({ where: { id: adId } });
  } catch (error) {
    console.error("Delete ad error:", error);
  }
}

export default async function AdminAdsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/login/admin");
  }

  let adPositions: any[] = [];
  let error = null;

  try {
    adPositions = await prisma.ad_positions.findMany({
      include: {
        ads: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { name: "asc" },
    });
  } catch (err: any) {
    console.error("Fetch ad positions error:", err);
    error = err.message;
  }

  const statusMap: Record<string, { label: string; color: string; next: string }> = {
    ACTIVE: { label: "投放中", color: "bg-green-100 text-green-700", next: "INACTIVE" },
    INACTIVE: { label: "已暂停", color: "bg-yellow-100 text-yellow-700", next: "ACTIVE" },
    PENDING: { label: "待审核", color: "bg-gray-100 text-gray-700", next: "ACTIVE" },
    EXPIRED: { label: "已过期", color: "bg-red-100 text-red-700", next: "ACTIVE" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">← 返回</Link>
            <h1 className="text-xl font-bold">广告管理</h1>
          </div>
          <Link href="/admin/ads/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            + 发布广告
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {error ? (
          <div className="p-6 bg-red-50 text-red-600 rounded-xl">
            <h3 className="font-bold mb-2">加载失败</h3>
            <p>{error}</p>
          </div>
        ) : adPositions.length === 0 ? (
          <div className="p-12 bg-white rounded-xl shadow-sm border text-center text-gray-500">
            <p>暂无广告位数据</p>
          </div>
        ) : (
          adPositions.map((pos) => (
            <div key={pos.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{pos.displayName}</h3>
                  <p className="text-sm text-gray-500 font-mono">{pos.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${pos.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {pos.isActive ? "启用中" : "已停用"}
                </span>
              </div>

              <div className="divide-y">
                {pos.ads.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">暂无广告</div>
                ) : (
                  pos.ads.map((ad) => {
                    const statusInfo = statusMap[ad.status] || { label: ad.status, color: "bg-gray-100 text-gray-600" };
                    return (
                      <div key={ad.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{ad.title}</p>
                          <p className="text-sm text-gray-500">
                            {ad.type} · {ad.linkUrl}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <form action={toggleAdStatus} className="inline">
                            <input type="hidden" name="adId" value={ad.id} />
                            <input type="hidden" name="status" value={statusInfo.next} />
                            <button type="submit" className="text-xs text-blue-600 hover:underline">
                              {ad.status === "ACTIVE" ? "暂停" : "启用"}
                            </button>
                          </form>
                          <form action={deleteAd} className="inline">
                            <input type="hidden" name="adId" value={ad.id} />
                            <button type="submit" className="text-xs text-red-600 hover:underline" onClick={() => confirm("确定删除？")}>
                              删除
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
