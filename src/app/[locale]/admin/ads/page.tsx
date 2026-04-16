import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdStatus } from "@prisma/client";

async function toggleAdStatus(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") return;
  const adId = formData.get("adId") as string;
  const status = formData.get("status") as AdStatus;
  await prisma.ads.update({ where: { id: adId }, data: { status } });
}

async function deleteAd(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") return;
  const adId = formData.get("adId") as string;
  await prisma.ads.delete({ where: { id: adId } });
}

export default async function AdminAdsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/login/admin");
  }

  const adPositions = await prisma.ad_positions.findMany({
    include: {
      ads: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { name: "asc" },
  });

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
        {adPositions.map((pos) => (
          <div key={pos.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div>
                <span className="font-semibold">{pos.displayName}</span>
                <span className="ml-2 text-xs text-gray-400 font-mono">{pos.name}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${pos.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                {pos.isActive ? "启用" : "禁用"}
              </span>
            </div>

            {pos.ads.length === 0 ? (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">暂无广告</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pos.ads.map((ad) => {
                  const st = statusMap[ad.status] || statusMap.PENDING;
                  return (
                    <div key={ad.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{ad.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${st.color}`}>{st.label}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {ad.type === "IMAGE" ? "图片" : "文字"} · {ad.linkUrl}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <form action={toggleAdStatus}>
                          <input type="hidden" name="adId" value={ad.id} />
                          <input type="hidden" name="status" value={st.next} />
                          <button type="submit" className="text-xs px-2 py-1 rounded border hover:bg-gray-50">
                            {ad.status === "ACTIVE" ? "暂停" : "启用"}
                          </button>
                        </form>
                        <form action={deleteAd}>
                          <input type="hidden" name="adId" value={ad.id} />
                          <button type="submit" className="text-xs px-2 py-1 rounded border text-red-600 hover:bg-red-50" onClick={() => confirm("确定删除此广告？")}>
                            删除
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
