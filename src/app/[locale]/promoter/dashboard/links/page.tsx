"use client"
import { useLocale } from "next-intl";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LinkItem {
  id: string;
  name: string;
  code: string;
  customRate: number | null;
  landingPage: string;
  status: string;
  clickCount: number;
  registerCount: number;
  orderCount: number;
  gmv: number;
  createdAt: string;
  fullUrl?: string;
}

export default function PromoterLinksPage() {
  const locale = useLocale();
  const router = useRouter();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", customRate: "", landingPage: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/promoter/links", { credentials: "include" });
      const json = await res.json();
      if (res.ok) {
        setLinks(json.links);
      } else if (res.status === 401) {
        router.push(`/${locale}/auth/login`);
      } else {
        router.push(`/${locale}/promoter/login`);
      }
    } catch {
      router.push(`/${locale}/promoter/login`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/promoter/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          customRate: formData.customRate ? Number(formData.customRate) : undefined,
          landingPage: formData.landingPage || "/",
        }),
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) {
        setLinks([json.link, ...links]);
        setShowForm(false);
        setFormData({ name: "", customRate: "", landingPage: "" });
      } else {
        alert(json.error || "创建失败");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("推广链接已复制");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">推广链接</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? "取消" : "+ 新建链接"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">链接名称 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：小红书引流"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">专属返佣比例 (%)</label>
              <input
                type="number"
                min={1}
                max={98}
                value={formData.customRate}
                onChange={(e) => setFormData({ ...formData, customRate: e.target.value })}
                placeholder="留空则使用默认比例"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">落地页</label>
              <input
                type="text"
                value={formData.landingPage}
                onChange={(e) => setFormData({ ...formData, landingPage: e.target.value })}
                placeholder="/ 或 /jobs/xxx"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "创建中..." : "确认创建"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 font-medium">返佣比例</th>
                <th className="px-4 py-3 font-medium">点击</th>
                <th className="px-4 py-3 font-medium">注册</th>
                <th className="px-4 py-3 font-medium">订单</th>
                <th className="px-4 py-3 font-medium">GMV</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {links.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    暂无推广链接，点击上方按钮创建
                  </td>
                </tr>
              ) : (
                links.map((link) => {
                  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform.com";
                  const url = `${siteUrl}${link.landingPage}${link.landingPage.includes("?") ? "&" : "?"}ref=${link.code}`;
                  return (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{link.name}</div>
                        <div className="text-xs text-gray-400">{link.code}</div>
                      </td>
                      <td className="px-4 py-3">{link.customRate ?? "默认"}% ✅</td>
                      <td className="px-4 py-3">{link.clickCount}</td>
                      <td className="px-4 py-3">{link.registerCount}</td>
                      <td className="px-4 py-3">{link.orderCount}</td>
                      <td className="px-4 py-3">${Number(link.gmv).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copyLink(url)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          复制链接
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
