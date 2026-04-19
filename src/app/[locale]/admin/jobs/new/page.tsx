"use client"
import { useLocale } from "next-intl";;

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewJobPage() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          requirements: formData.get("requirements"),
          benefits: formData.get("benefits"),
          location: formData.get("location"),
          city: formData.get("city"),
          employmentType: formData.get("employmentType"),
          salaryMin: parseInt(formData.get("salaryMin") as string) || null,
          salaryMax: parseInt(formData.get("salaryMax") as string) || null,
          applyUrl: formData.get("applyUrl"),
          companyId: formData.get("companyId"),
        }),
      });

      if (res.ok) {
        router.push(`/${locale}/admin`);
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
          <h1 className="text-2xl font-bold">发布新职位</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
          )}

          <div>
            <label className="block font-medium mb-2">职位标题 *</label>
            <input
              name="title"
              type="text"
              required
              className="w-full border rounded-md px-3 py-2"
              placeholder="例如：高级前端工程师"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2">城市 *</label>
              <input
                name="city"
                type="text"
                required
                className="w-full border rounded-md px-3 py-2"
                placeholder="例如：北京"
              />
            </div>
            <div>
              <label className="block font-medium mb-2">详细地址</label>
              <input
                name="location"
                type="text"
                className="w-full border rounded-md px-3 py-2"
                placeholder="例如：朝阳区建国路"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2">工作类型</label>
              <select name="employmentType" className="w-full border rounded-md px-3 py-2">
                <option value="FULL_TIME">全职</option>
                <option value="PART_TIME">兼职</option>
                <option value="CONTRACT">合同</option>
                <option value="INTERNSHIP">实习</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-2">薪资范围（年薪）</label>
              <div className="flex items-center gap-2">
                <input
                  name="salaryMin"
                  type="number"
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="最低"
                />
                <span>-</span>
                <input
                  name="salaryMax"
                  type="number"
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="最高"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-2">申请链接 *</label>
            <input
              name="applyUrl"
              type="url"
              required
              className="w-full border rounded-md px-3 py-2"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block font-medium mb-2">职位描述 *</label>
            <textarea
              name="description"
              required
              rows={6}
              className="w-full border rounded-md px-3 py-2"
              placeholder="详细描述职位职责..."
            />
          </div>

          <div>
            <label className="block font-medium mb-2">任职要求</label>
            <textarea
              name="requirements"
              rows={4}
              className="w-full border rounded-md px-3 py-2"
              placeholder="学历、经验、技能等要求..."
            />
          </div>

          <div>
            <label className="block font-medium mb-2">福利待遇</label>
            <textarea
              name="benefits"
              rows={3}
              className="w-full border rounded-md px-3 py-2"
              placeholder="五险一金、带薪年假等..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "发布中..." : "发布职位"}
            </button>
            <Link
              href="/admin"
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 inline-block"
            >
              取消
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
