"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { Footer } from "@/components/footer";
import { Wallet, Coins, Loader2, CheckCircle2, Bitcoin, CreditCard, ExternalLink, ArrowLeft } from "lucide-react";

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

type PaymentMethod = "CARD" | "CRYPTO";

export default function RechargePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CRYPTO");
  const [submitting, setSubmitting] = useState(false);
  const [plisioUrl, setPlisioUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // 检查URL参数（支付返回状态）
  useEffect(() => {
    const statusParam = searchParams?.get("status");
    if (statusParam === "success") {
      setMessage({ type: "success", text: "支付成功！余额已到账" });
      fetchBalance();
    } else if (statusParam === "cancelled") {
      setMessage({ type: "info", text: "支付已取消" });
    }
  }, [searchParams]);

  // 鉴权重定向
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/login?callbackUrl=/user/recharge`);
    }
  }, [status, router, locale]);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/user/balance");
      const data = await res.json();
      if (typeof data.balance === "number") {
        setBalance(data.balance);
        setTransactions((data.transactions || []).filter((t: any) => t.type === "RECHARGE"));
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  useEffect(() => {
    fetchBalance().finally(() => setLoading(false));
  }, []);

  const handleRecharge = async () => {
    setSubmitting(true);
    setMessage(null);
    setPlisioUrl(null);

    try {
      if (paymentMethod === "CRYPTO") {
        const res = await fetch("/api/payments/plisio/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: selected }),
        });
        const data = await res.json();

        if (res.ok && data.paymentUrl) {
          setPlisioUrl(data.paymentUrl);
          setMessage({
            type: "info",
            text: "加密货币支付订单已创建，点击下方按钮跳转到支付页面",
          });
        } else {
          setMessage({
            type: "error",
            text: data.error || "创建支付订单失败",
          });
        }
      } else {
        const res = await fetch("/api/user/recharge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: selected }),
        });
        const data = await res.json();

        if (res.ok) {
          setMessage({
            type: "info",
            text: "银行卡/支付宝支付即将接入，目前请使用加密货币支付",
          });
        } else {
          setMessage({ type: "error", text: data.error || "充值失败" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setSubmitting(false);
    }
  };

  const openPlisioPayment = () => {
    if (plisioUrl) {
      window.open(plisioUrl, "_blank");
    }
  };

  const selectedOption = RECHARGE_OPTIONS.find((opt) => opt.amount === selected)!;

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

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl text-white p-5 mb-6">
            <p className="text-blue-100 text-sm">当前余额</p>
            <p className="text-3xl font-bold mt-1">
              {loading && balance === null ? "--" : `¥${(balance || 0).toFixed(2)}`}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">选择充值金额</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {RECHARGE_OPTIONS.map((opt) => (
                <button
                  key={opt.amount}
                  onClick={() => {
                    setSelected(opt.amount);
                    setPlisioUrl(null);
                    setMessage(null);
                  }}
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

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">选择支付方式</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPaymentMethod("CARD");
                  setPlisioUrl(null);
                  setMessage(null);
                }}
                className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  paymentMethod === "CARD"
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">银行卡 / 支付宝</p>
                  <p className="text-xs text-gray-500">即将接入</p>
                </div>
                {paymentMethod === "CARD" && (
                  <div className="absolute right-4 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>

              <button
                onClick={() => {
                  setPaymentMethod("CRYPTO");
                  setPlisioUrl(null);
                  setMessage(null);
                }}
                className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  paymentMethod === "CRYPTO"
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">加密货币</p>
                  <p className="text-xs text-gray-500">BTC, ETH, USDT 等</p>
                </div>
                {paymentMethod === "CRYPTO" && (
                  <div className="absolute right-4 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">充值金额</span>
              <span className="font-medium">¥{selectedOption.amount}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">赠送金额</span>
              <span className="font-medium text-amber-600">+¥{selectedOption.bonus}</span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">实际到账</span>
              <span className="text-xl font-bold text-blue-600">¥{selectedOption.get}</span>
            </div>
          </div>

          {!plisioUrl ? (
            <button
              onClick={handleRecharge}
              disabled={submitting || paymentMethod === "CARD"}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : paymentMethod === "CARD" ? (
                <>
                  <CreditCard className="w-4 h-4" />
                  银行卡/支付宝（即将接入）
                </>
              ) : (
                <>
                  <Bitcoin className="w-4 h-4" />
                  使用加密货币支付 ¥{selected}
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={openPlisioPayment}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                跳转到加密货币支付页面
              </button>
              <button
                onClick={() => {
                  setPlisioUrl(null);
                  setMessage(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                返回选择其他支付方式
              </button>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-100"
                  : "bg-blue-50 text-blue-700 border border-blue-100"
              }`}
            >
              {message.text}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-400 text-center">
            赠送余额不可提现，充值后可用于解锁职位联系方式。
            <br />
            使用 Plisio 提供的安全加密货币支付服务
          </p>
        </div>

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
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-600">+¥{Number(t.amount).toFixed(2)}</span>
                    {t.payment_method === "CRYPTO" && (
                      <p className="text-xs text-orange-500">加密货币</p>
                    )}
                  </div>
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
