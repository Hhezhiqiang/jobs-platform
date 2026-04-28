"use client";

import { useState } from "react";
import { Globe, Briefcase, Loader2 } from "lucide-react";

export function AdzunaSyncButtons() {
  const [syncing, setSyncing] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);

  async function handleTestSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-adzuna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: "software engineer",
          location: "London",
          bulk: false,
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert(`✅ 成功同步 ${result.count} 个职位`);
        window.location.reload();
      } else {
        alert(`❌ 同步失败：${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ 同步失败：${error.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleBulkSync() {
    if (
      !confirm(
        "将同步英国 3 城市×3 关键词≈450 个职位，耗时约 3-5 分钟，确定继续？"
      )
    )
      return;

    setBulkSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-adzuna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true }),
      });
      const result = await res.json();
      if (result.success) {
        alert(`✅ 批量同步完成，新增 ${result.count} 个职位`);
        window.location.reload();
      } else {
        alert(`❌ 同步失败：${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ 同步失败：${error.message}`);
    } finally {
      setBulkSyncing(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">海外职位同步</h2>
          <p className="text-sm text-gray-600">从 Adzuna API 同步全球职位数据</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 测试同步按钮 */}
        <button
          onClick={handleTestSync}
          disabled={syncing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {syncing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              同步中...
            </>
          ) : (
            <>
              <Globe className="w-5 h-5" />
              测试同步（伦敦 - 软件工程师）
            </>
          )}
        </button>

        {/* 批量同步按钮 */}
        <button
          onClick={handleBulkSync}
          disabled={bulkSyncing}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {bulkSyncing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              批量同步中...
            </>
          ) : (
            <>
              <Briefcase className="w-5 h-5" />
              批量同步（英国区）
            </>
          )}
        </button>

        <div className="bg-white/60 rounded-lg p-3 text-xs text-gray-600">
          <p className="flex items-start gap-2">
            <span>ℹ️</span>
            <span>
              首次同步建议先测试，确认数据质量后再批量同步。同步后的职位会自动显示在前台职位列表中。
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
