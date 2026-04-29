"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";

type Ad = {
  id: string;
  title: string;
  type: string;
  linkUrl: string;
  status: string;
  createdAt: string;
};

type AdPosition = {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  ads: Ad[];
};

export default function AdminAdsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/ads")
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push("/zh/auth/login/admin");
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "获取广告列表失败");
        }
        return res.json();
      })
      .then((data) => {
        if (data) setPositions(data.positions || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const statusMap: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: "投放中", color: "bg-green-100 text-green-700" },
    INACTIVE: { label: "已暂停", color: "bg-yellow-100 text-yellow-700" },
    PENDING: { label: "待审核", color: "bg-gray-100 text-gray-700" },
    EXPIRED: { label: "已过期", color: "bg-red-100 text-red-700" },
  };

  if (loading) {
    return <div className="flex items-center justify-center"><p className="text-gray-500">加载中...</p></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-4 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">广告管理</h1>
        <Link href={`/${locale}/admin/ads/new`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ 发布广告</Link>
      </div>

      {positions.length === 0 ? (
        <div className="p-12 bg-white rounded-xl shadow-sm border text-center text-gray-500">暂无广告位数据</div>
      ) : (
        positions.map((pos) => (
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
                    <div key={ad.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{ad.title}</p>
                        <p className="text-sm text-gray-500">{ad.type} · {ad.linkUrl}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
