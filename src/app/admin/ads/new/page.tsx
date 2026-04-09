"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewAdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          type: formData.get("type"),
          imageUrl: formData.get("imageUrl"),
          linkUrl: formData.get("linkUrl"),
          textContent: formData.get("textContent"),
          positionId: formData.get("positionId"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate") || null,
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
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/ads" className="text-blue-600 hover:text-blue-800">
              ← 返回广告管理
            </Link>
            <h1 className="text-2xl font-bold">发布新广告</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
          )}

          <div>
            <label className="block font-medium mb-2">广告标题 *</label>
            <input
              name="title"
              type="text"
              required
              className="w-full border rounded-md px-3 py-2"
              placeholder="例如：春季招聘特惠"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">广告类型</label>
            <select name="type" className="w-full border rounded-md px-3 py-2">
              <option value="IMAGE">图片广告</option>
              <option value="TEXT">文字链广告</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2">图片URL</label>
            <input
              name="imageUrl"
              type="url"
              className="w-full border rounded-md px-3 py-2"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">链接URL *</label>
            <input
              name="linkUrl"
              type="url"
              required
              className="w-full border rounded-md px-3 py-2"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">文字内容（文字链广告）</label>
            <textarea
              name="textContent"
              rows={3}
              className="w-full border rounded-md px-3 py-2"
              placeholder="简短描述..."
            />
          </div>

          <div>
            <label className="block font-medium mb-2">广告位标识 *</label>
            <input
              name="positionId"
              type="text"
              required
              className="w-full border rounded-md px-3 py-2"
              placeholder="例如：HP_BANNER_01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2">开始日期</label>
              <input
                name="startDate"
                type="date"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-2">结束日期（可选）</label>
              <input
                name="endDate"
                type="date"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "发布中..." : "发布广告"}
            </button>
            <Link
              href="/admin/ads"
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
            >
              取消
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
