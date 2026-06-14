"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface PromoterProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  walletAddress: string | null;
  defaultRate: number;
  status: string;
}

export default function PromoterSettingsPage() {
  const locale = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<PromoterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ phone: "", walletAddress: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/promoter/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.promoter) {
        router.push(`/${locale}/promoter/login`);
        return;
      }
      setProfile(json.promoter);
      setFormData({
        phone: json.promoters.phone || "",
        walletAddress: json.promoters.walletAddress || "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/promoter/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone || null,
          walletAddress: formData.walletAddress || null,
        }),
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) {
        setMessage("✅ 资料已保存");
        setProfile(json.promoter);
      } else {
        setMessage(`❌ ${json.error || "保存失败"}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8"><div className="bg-white rounded-xl shadow-sm h-64 animate-pulse" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">账户设置</h1>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{message}</div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        {/* 只读信息 */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">姓名</label>
          <p className="text-gray-900">{profile?.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">邮箱</label>
          <p className="text-gray-900">{profile?.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">状态</label>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            profile?.status === "ACTIVE" ? "bg-green-100 text-green-700" :
            profile?.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>
            {profile?.status === "ACTIVE" ? "已激活" : profile?.status === "PENDING" ? "审核中" : "已封禁"}
          </span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">默认返佣比例</label>
          <p className="text-gray-900 font-semibold">{profile?.defaultRate}%</p>
        </div>

        {/* 可编辑信息 */}
        <div className="border-t pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">编辑信息</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="选填"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TRC-20 钱包地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
              placeholder="T开头，用于接收 USDT 佣金"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">提现需要钱包地址，请确保地址正确</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存修改"}
        </button>
      </form>
    </div>
  );
}
