"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CommissionItem {
  id: string;
  orderAmount: number;
  rate: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
  availableAt: string | null;
}

interface WithdrawalItem {
  id: string;
  amount: number;
  walletAddress: string;
  txHash: string | null;
  status: string;
  requestedAt: string;
}

const statusMap: Record<string, string> = {
  FROZEN: "冻结中",
  AVAILABLE: "可提现",
  WITHDRAWN: "已提现",
  CLAWED_BACK: "已退回",
  PENDING: "审核中",
  APPROVED: "已通过",
  TRANSFERRING: "转账中",
  COMPLETED: "已完成",
  REJECTED: "已拒绝",
};

export default function PromoterEarningsPage() {
  const router = useRouter();
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<"commissions" | "withdrawals">("commissions");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cRes, wRes, meRes] = await Promise.all([
        fetch("/api/promoter/commissions?limit=50", { credentials: "include" }),
        fetch("/api/promoter/withdrawals", { credentials: "include" }),
        fetch("/api/promoter/me", { credentials: "include" }),
      ]);
      const cJson = await cRes.json();
      const wJson = await wRes.json();
      const mJson = await meRes.json();

      if (!meRes.ok) {
        router.push(meRes.status === 401 ? "/auth/login" : "/promoter/login");
        return;
      }

      if (cRes.ok) setCommissions(cJson.items || []);
      if (wRes.ok) setWithdrawals(wJson.withdrawals || []);
      if (meRes.ok) setBalance(Number(mJson.promoter?.availableBalance || 0));
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (amount < 10) {
      alert("最低提现 10 USDT");
      return;
    }
    if (amount > balance) {
      alert("可提现余额不足");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/promoter/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) {
        alert("提现申请已提交，请等待审核");
        setWithdrawAmount("");
        loadData();
      } else {
        alert(json.error || "提现失败");
      }
    } finally {
      setWithdrawing(false);
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">收益提现</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex gap-4 border-b mb-4">
            <button
              onClick={() => setActiveTab("commissions")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "commissions" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
              }`}
            >
              佣金明细
            </button>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "withdrawals" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
              }`}
            >
              提现记录
            </button>
          </div>

          {activeTab === "commissions" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2">订单金额</th>
                    <th className="px-3 py-2">比例</th>
                    <th className="px-3 py-2">佣金</th>
                    <th className="px-3 py-2">状态</th>
                    <th className="px-3 py-2">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-500">暂无佣金记录</td>
                    </tr>
                  ) : (
                    commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">${c.orderAmount.toFixed(2)}</td>
                        <td className="px-3 py-2">{c.rate}%</td>
                        <td className="px-3 py-2 font-medium">+${c.commissionAmount.toFixed(4)}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              c.status === "AVAILABLE"
                                ? "bg-green-100 text-green-700"
                                : c.status === "FROZEN"
                                ? "bg-orange-100 text-orange-700"
                                : c.status === "CLAWED_BACK"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {statusMap[c.status] || c.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2">金额</th>
                    <th className="px-3 py-2">状态</th>
                    <th className="px-3 py-2">TXID</th>
                    <th className="px-3 py-2">申请时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-gray-500">暂无提现记录</td>
                    </tr>
                  ) : (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">-{w.amount.toFixed(2)} USDT</td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              w.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : w.status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {statusMap[w.status] || w.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 truncate max-w-[120px]">
                          {w.txHash || "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {new Date(w.requestedAt).toLocaleDateString("zh-CN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">申请提现</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-500">可提现余额</p>
            <p className="text-2xl font-bold text-green-600">
              {balance.toFixed(2)} USDT
            </p>
          </div>
          <form onSubmit={handleWithdraw}>
            <label className="block text-sm font-medium text-gray-700 mb-1">提现金额</label>
            <input
              type="number"
              step="0.01"
              min={10}
              required
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="最低 10 USDT"
              className="w-full px-3 py-2 border rounded-lg mb-3"
            />
            <button
              type="submit"
              disabled={withdrawing || balance < 10}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {withdrawing ? "提交中..." : "申请提现"}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-3">
            TRC-20 转账，平台承担手续费，1-3 个工作日到账
          </p>
        </div>
      </div>
    </div>
  );
}
