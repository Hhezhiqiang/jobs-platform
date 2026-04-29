"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface KeywordItem {
  id: string;
  keyword: string;
  normalized: string;
  source: string;
  category: string;
  intent: string;
  status: string;
  trendScore: number;
  hotLevel: number;
  lastSeenAt: string;
  firstSeenAt: string;
  _count: { keyword_archives: number; seo_plans: number };
}

interface SEOPlanItem {
  id: string;
  monitorId: string;
  pageType: string;
  title: string;
  h1: string;
  metaDesc: string;
  keywords: string[];
  status: string;
  generatedAt: string;
  approvedAt?: string;
  publishedAt?: string;
  targetUrl?: string;
  monitor?: { keyword: string };
}

interface ArchiveItem {
  id: string;
  contentType: string;
  contentTitle?: string;
  contentBody: string;
  contentUrl?: string;
  relevanceScore?: number;
  fetchedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  PRIMARY: "bg-emerald-100 text-emerald-700",
  TRAFFIC: "bg-blue-100 text-blue-700",
  JUNK: "bg-gray-100 text-gray-600",
  HOLD: "bg-amber-100 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
};

export default function AdminKeywordsPage() {
  const [tab, setTab] = useState<"keywords" | "plans">("keywords");
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [plans, setPlans] = useState<SEOPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedArchives, setSelectedArchives] = useState<ArchiveItem[]>([]);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveModalKeyword, setArchiveModalKeyword] = useState("");
  const [collectingArchivesForId, setCollectingArchivesForId] = useState<string | null>(null);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/admin/keywords?${params.toString()}`);
      if (!res.ok) throw new Error("获取关键词列表失败");
      const data = await res.json();
      setKeywords(data.items || []);
    } catch (err) {
      console.error("fetchKeywords error:", err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/seo-plans?limit=50`);
      if (!res.ok) throw new Error("获取SEO方案列表失败");
      const data = await res.json();
      setPlans(data.items || []);
    } catch (err) {
      console.error("fetchPlans error:", err);
    }
  }, []);

  async function triggerCollect() {
    setCollecting(true);
    try {
      const res = await fetch("/api/admin/keywords/collect", { method: "POST" });
      if (!res.ok) throw new Error("采集请求失败");
      const data = await res.json();
      setCollecting(false);
      alert(`采集完成: 新增 ${data.result?.inserted || 0}, 更新 ${data.result?.duplicates || 0}, 错误 ${data.result?.errors || 0}`);
      fetchKeywords();
    } catch (err) {
      setCollecting(false);
      console.error("triggerCollect error:", err);
      alert("采集失败，请重试");
    }
  }

  async function updateKeyword(id: string, payload: Partial<KeywordItem>) {
    try {
      const res = await fetch(`/api/admin/keywords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("更新失败");
      fetchKeywords();
    } catch (err) {
      console.error("updateKeyword error:", err);
    }
  }

  async function deleteKeyword(id: string) {
    if (!confirm("确定删除该关键词监控记录？关联的素材和SEO方案也将被删除。")) return;
    try {
      const res = await fetch(`/api/admin/keywords/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      fetchKeywords();
    } catch (err) {
      console.error("deleteKeyword error:", err);
    }
  }

  async function generatePlan(monitorId: string) {
    try {
      const res = await fetch("/api/admin/seo-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitorId }),
      });
      if (!res.ok) throw new Error("生成方案请求失败");
      const data = await res.json();
      if (data.success) {
        alert("SEO方案生成成功！");
        fetchKeywords();
        if (tab === "plans") fetchPlans();
      } else {
        alert(data.error || "生成失败");
      }
    } catch (err) {
      console.error("generatePlan error:", err);
      alert("生成方案失败，请重试");
    }
  }

  async function publishPlan(planId: string) {
    try {
      const res = await fetch("/api/admin/seo-plans/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) throw new Error("发布请求失败");
      const data = await res.json();
      if (data.success) {
        alert(`发布成功: ${data.url}`);
        fetchPlans();
      } else {
        alert(data.error || "发布失败");
      }
    } catch (err) {
      console.error("publishPlan error:", err);
      alert("发布失败，请重试");
    }
  }

  async function fetchArchives(monitorId: string, keyword: string) {
    try {
      const res = await fetch(`/api/admin/keywords/${monitorId}/archives`);
      if (!res.ok) throw new Error("获取素材失败");
      const data = await res.json();
      setSelectedArchives(data.items || []);
      setArchiveModalKeyword(keyword);
      setArchiveModalOpen(true);
    } catch (err) {
      console.error("fetchArchives error:", err);
      alert("获取素材失败，请重试");
    }
  }

  async function collectArchivesForKeyword(monitorId: string) {
    setCollectingArchivesForId(monitorId);
    try {
      const res = await fetch(`/api/admin/keywords/${monitorId}/archives`, { method: "POST" });
      if (!res.ok) throw new Error("素材采集请求失败");
      const data = await res.json();
      setCollectingArchivesForId(null);
      if (data.success) {
        alert(`素材采集完成: 新增 ${data.result?.inserted || 0}, 错误 ${data.result?.errors || 0}`);
      } else {
        alert(data.error || "素材采集失败");
      }
    } catch (err) {
      setCollectingArchivesForId(null);
      console.error("collectArchivesForKeyword error:", err);
      alert("素材采集失败，请重试");
    }
  }

  // 初始加载数据
  useEffect(() => {
    const load = async () => {
      await fetchKeywords();
      await fetchPlans();
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Collect Button Bar */}
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm">← 返回概览</Link>
        <button
          onClick={triggerCollect}
          disabled={collecting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {collecting ? "采集中..." : "立即采集"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b">
        <button
          onClick={() => setTab("keywords")}
          className={`pb-3 font-medium ${
            tab === "keywords" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"
          }`}
        >
          热词监控 ({keywords.length})
        </button>
        <button
          onClick={() => setTab("plans")}
          className={`pb-3 font-medium ${
            tab === "plans" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"
          }`}
        >
          SEO方案 ({plans.length})
        </button>
      </div>

      {tab === "keywords" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">全部分类</option>
              <option value="PRIMARY">PRIMARY</option>
              <option value="TRAFFIC">TRAFFIC</option>
              <option value="JUNK">JUNK</option>
              <option value="HOLD">HOLD</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待处理</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已拒绝</option>
            </select>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">关键词</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">来源</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">分类</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">热度</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">方案</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">素材</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {keywords.map((k) => (
                    <tr key={k.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{k.keyword}</div>
                        <div className="text-xs text-gray-400">{k.normalized}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{k.source}</td>
                      <td className="px-4 py-3">
                        <select
                          value={k.category}
                          onChange={(e) => updateKeyword(k.id, { category: e.target.value })}
                          className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${CATEGORY_COLORS[k.category] || "bg-gray-100"}`}
                        >
                          <option value="PRIMARY">PRIMARY</option>
                          <option value="TRAFFIC">TRAFFIC</option>
                          <option value="JUNK">JUNK</option>
                          <option value="HOLD">HOLD</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {"🔥".repeat(k.hotLevel)}
                          {"🌑".repeat(5 - k.hotLevel)}
                          <span className="ml-2 text-gray-500">{k.trendScore.toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={k.status}
                          onChange={(e) => updateKeyword(k.id, { status: e.target.value })}
                          className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${STATUS_COLORS[k.status] || "bg-gray-100"}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="PUBLISHED">PUBLISHED</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{k._count.seo_plans}</td>
                      <td className="px-4 py-3 text-gray-600">{k._count.keyword_archives}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => generatePlan(k.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium mr-3"
                        >
                          生成方案
                        </button>
                        <button
                          onClick={() => fetchArchives(k.id, k.keyword)}
                          className="text-indigo-600 hover:text-indigo-700 font-medium mr-3"
                        >
                          查看素材
                        </button>
                        <button
                          onClick={() => collectArchivesForKeyword(k.id)}
                          disabled={collectingArchivesForId === k.id}
                          className="text-purple-600 hover:text-purple-700 font-medium mr-3 disabled:opacity-50"
                        >
                          {collectingArchivesForId === k.id ? "采集中..." : "采集素材"}
                        </button>
                        <button
                          onClick={() => deleteKeyword(k.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">素材归档: {archiveModalKeyword}</h3>
              <button onClick={() => setArchiveModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                关闭
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedArchives.length === 0 && (
                <p className="text-gray-500">暂无素材，请点击&quot;采集素材&quot;按钮获取。</p>
              )}
              {selectedArchives.map((a) => (
                <div key={a.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {a.contentType}
                    </span>
                    {typeof a.relevanceScore === "number" && (
                      <span className="text-xs text-gray-500">相关度: {(a.relevanceScore * 100).toFixed(0)}%</span>
                    )}
                  </div>
                  {a.contentTitle && (
                    <h4 className="font-medium text-gray-900 mb-1">{a.contentTitle}</h4>
                  )}
                  <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{a.contentBody}</p>
                  {a.contentUrl && (
                    <a href={a.contentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      查看原文 →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "plans" && (
        <div className="grid gap-4">
          {plans.length === 0 && <p className="text-gray-500">暂无SEO方案，请在热词监控中生成。</p>}
          {plans.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.pageType}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[p.status] || "bg-gray-100"}`}>{p.status}</span>
                  <h3 className="font-bold text-gray-900">{p.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {p.status === "PENDING" && (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/admin/seo-plans", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: p.id, status: "APPROVED" }),
                            });
                            if (!res.ok) throw new Error("审批操作失败");
                            fetchPlans();
                          } catch (err) {
                            console.error("approve plan error:", err);
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        通过
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/admin/seo-plans", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: p.id, status: "REJECTED" }),
                            });
                            if (!res.ok) throw new Error("审批操作失败");
                            fetchPlans();
                          } catch (err) {
                            console.error("reject plan error:", err);
                          }
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                      >
                        拒绝
                      </button>
                    </>
                  )}
                  {p.status === "APPROVED" && (
                    <button
                      onClick={() => publishPlan(p.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                    >
                      发布博客
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">H1: {p.h1}</p>
              <p className="text-sm text-gray-500 mb-2">Meta: {p.metaDesc}</p>
              <p className="text-sm text-gray-500 mb-1">关键词: {p.keywords?.join(", ")}</p>
              {p.targetUrl && <p className="text-sm text-gray-400">建议URL: {p.targetUrl}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
