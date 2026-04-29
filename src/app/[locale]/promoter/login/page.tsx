"use client"
import { useLocale } from "next-intl";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const subscribe = () => () => {};
const getServerSnapshot = () => "/promoter/login";

function getCallbackUrl(): string {
  if (typeof window === "undefined") return "/promoter/login";
  const sp = new URLSearchParams(window.location.search);
  return sp.get("callbackUrl") || "/promoter/login";
}

export default function PromoterLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const callbackUrl = useSyncExternalStore(
    subscribe,
    getCallbackUrl,
    getServerSnapshot
  );

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((session) => {
        if (session?.user?.email) {
          setHasSession(true);
          // 2. 自动检查该用户是否已是推广者
          fetch("/api/promoter/me", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
              setLoading(false);
              if (data?.promoter?.status === "ACTIVE") {
                router.replace("/promoter/dashboard");
              } else if (data?.promoter?.status === "PENDING") {
                setError("账号审核中，请联系客服");
              } else if (data?.error) {
                setError(data.error);
              }
            })
            .catch(() => {
              setLoading(false);
              setError("推广者服务暂不可用");
            });
        } else {
          setLoading(false);
          setHasSession(false);
        }
      })
      .catch(() => {
        setLoading(false);
        setHasSession(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/promoter/me", { credentials: "include" });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.promoter) {
        setError(data.error || "该账号未注册推广者");
      } else if (data.promoter.status !== "ACTIVE") {
        setError("账号审核中或已被封禁，请联系客服");
      } else {
        router.push(`/${locale}/promoter/dashboard`);
      }
    } catch {
      setLoading(false);
      setError("网络错误，请稍后重试");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-gray-500">正在检查登录状态...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">推广者登录</h1>

        {!hasSession && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            推广者后台已接入主站账号体系，请先登录。
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {hasSession ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">注册邮箱</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "登录中..." : "进入后台"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <Link
              href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="w-full block text-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              前往主站登录
            </Link>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-gray-500">
          还没有账号？{" "}
          <Link href={`/${locale}/promoter/register`} className="text-blue-600 hover:underline">
            申请成为推广者
          </Link>
        </p>
      </div>
    </div>
  );
}

