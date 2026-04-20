"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Mail, Phone, Loader2, Wallet } from "lucide-react";

interface ContactUnlockCardProps {
  jobId: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isUnlocked: boolean;
  price: number;
  isLoggedIn: boolean;
}

export function ContactUnlockCard({
  jobId,
  contactEmail,
  contactPhone,
  isUnlocked,
  price,
  isLoggedIn,
}: ContactUnlockCardProps) {
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/user/balance")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.balance === "number") {
          setBalance(data.balance);
        }
      })
      .catch(console.error)
      .finally(() => setBalanceLoading(false));
  }, [isLoggedIn]);

  const handleUnlock = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders/contact-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (res.ok) {
        setUnlocked(true);
        if (typeof data.newBalance === "number") {
          setBalance(data.newBalance);
        }
      } else if (data.code === "INSUFFICIENT_BALANCE") {
        alert(data.error || "余额不足");
      } else {
        alert(data.error || "解锁失败");
      }
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const hasContact = !!contactEmail || !!contactPhone;

  if (!hasContact) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-3">联系方式</h3>
        <p className="text-sm text-gray-500">该职位未公布直接联系方式，请通过上方按钮投递简历。</p>
      </div>
    );
  }

  if (unlocked) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">联系方式</h3>
        <div className="space-y-3">
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium">{contactEmail}</span>
            </a>
          )}
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
            >
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium">{contactPhone}</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  const insufficient = balance !== null && balance < price;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-900 mb-3">联系方式</h3>
      <div className="relative">
        {/* 模糊遮罩层 */}
        <div className="blur-sm select-none pointer-events-none space-y-3 mb-4">
          {contactEmail && (
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm">••••••••@•••.com</span>
            </div>
          )}
          {contactPhone && (
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm">+86 •••• •••• ••••</span>
            </div>
          )}
        </div>

        {/* 解锁按钮 */}
        <div className="text-center space-y-2">
          {isLoggedIn ? (
            <>
              <button
                onClick={handleUnlock}
                disabled={loading || balanceLoading || insufficient}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {loading ? "解锁中..." : `支付 ¥${price} 解锁`}
              </button>

              {balanceLoading ? (
                <p className="text-xs text-gray-400">查询余额中...</p>
              ) : balance !== null ? (
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>账户余额 ¥{balance.toFixed(2)}</span>
                </div>
              ) : null}

              {insufficient && (
                <div className="pt-1">
                  <Link
                    href="/user/recharge"
                    className="inline-flex items-center gap-1 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-all"
                  >
                    余额不足，立即充值
                  </Link>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              <Lock className="w-4 h-4" />
              登录后解锁
            </Link>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">一次性付费，永久查看该职位联系方式</p>
      </div>
    </div>
  );
}
