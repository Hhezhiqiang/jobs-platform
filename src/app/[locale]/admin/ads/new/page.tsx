"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdPosition { id: string; name: string; displayName: string; isActive: boolean }

export default function NewAdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [adType, setAdType] = useState("IMAGE");

  useEffect(() => {
    fetch("/api/ads/positions")
      .then(r => r.json())
      .then(data => setPositions(data.positions || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          type: adType,
          imageUrl: adType === "IMAGE" ? formData.get("imageUrl") : null,
          linkUrl: formData.get("linkUrl"),
          textContent: adType === "TEXT" ? formData.get("textContent") : null,
          positionId: formData.get("positionId"),
        }),
      });

      if (res.ok) {
        router.push("/admin/ads");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "发布失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/ads" className="text-gray-500 hover:text-gray-700">← 返回</Link>
          <h1 className="text-lg font-bold">发布广告</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1.5">广告标题 *</label>
            <input name="title" type="text" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="简短描述" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">广告位 *</label>
            <select name="positionId" required className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">选择广告位</option>
              {positions.filter(p => p.isActive).map(p => (
                <option key={p.id} value={p.name}>{p.displayName} ({p.name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">类型</label>
            <div className="flex gap-4">
              {["IMAGE", "TEXT"].map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="adType" value={type} checked={adType === type} onChange={() => setAdType(type)} className="accent-blue-600" />
                  <span className="text-sm">{type === "IMAGE" ? "图片" : "文字链"}</span>
                </label>
              ))}
            </div>
          </div>

          {adType === "IMAGE" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">图片URL *</label>
              <input name="imageUrl" type="url" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">链接URL *</label>
            <input name="linkUrl" type="url" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
          </div>

          {adType === "TEXT" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">文字内容</label>
              <textarea name="textContent" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="简短描述..." />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
              {loading ? "发布中..." : "发布"}
            </button>
            <Link href="/admin/ads" className="px-6 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
