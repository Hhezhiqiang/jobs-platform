"use client";

import { useState, useEffect } from "react";
import { Footer } from "@/components/footer";
import { Wallet, Coins, Loader2, CheckCircle2 } from "lucide-react";

interface RechargeOption {
  amount: number;
  get: number;
  bonus: number;
  popular?: boolean;
}

const RECHARGE_OPTIONS: RechargeOption[] = [
  { amount: 10, get: 10, bonus: 0 },
  { amount: 30, get: 30, bonus: 0 },
  { amount: 50, get: 55, bonus: 5, popular: true },
  { amount: 100, get: 115, bonus: 15 },
];

export default function RechargePage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/user/balance")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.balance === "number") {
          setBalance(data.balance);
          setTransactions((data.transactions || []).filter((t: any) => t.type === "RECHARGE"));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRecharge = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selected }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `充值订单已创建（¥${selected}），支付接口即将接入` });
      } else {
        setMessage({ type: "error", text: data.error || "充值失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">账户充值</h1>
          </div>

          {/* 余额卡片 */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl text-white p-5 mb-6">
            <p className="text-blue-100 text-sm">当前余额</p>
            <p className="text-3xl font-bold mt-1">
              {loading && balance === null ? "--" : `¥${(balance || 0).toFixed(2)}`}
            </p>
          </div>

          {/* 充值档位 */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">选择充值金额</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {RECHARGE_OPTIONS.map((opt) => (
                <button
                  key={opt.amount}
                  onClick={() => setSelected(opt.amount)}
                  className={`relative rounded-xl border p-4 text-left transition-all ${
                    selected === opt.amount
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  {opt.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                      超值
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-gray-900 font-bold text-lg">
                    <Coins className="w-4 h-4 text-amber-500" />
                    ¥{opt.amount}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">到账 ¥{opt.get}</div>
                  {opt.bonus > 0 && (
                    <div className="mt-1 text-xs text-amber-600 font-medium">+¥{opt.bonus} 赠送</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 确认按钮 */}
          <button
            onClick={handleRecharge}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 font-medium"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {submitting ? "创建订单中..." : `立即充值 ¥${selected}`}
          </button>

          {message && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}
            >
              {message.text}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-400 text-center">
            赠送余额不可提现，充值后可用于解锁职位联系方式。
          </p>
        </div>

        {/* 最近充值记录 */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">最近充值记录</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400">暂无充值记录</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900">{t.description || "账户充值"}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-green-600">+¥{Number(t.amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
