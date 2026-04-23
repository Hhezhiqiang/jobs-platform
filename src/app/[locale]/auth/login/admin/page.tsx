"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Shield } from "lucide-react";
import { Metadata } from "next";
import { SkipLink } from "@/components/skip-link";

export const metadata: Metadata = {
  title: "管理员登录 | 招聘平台",
  description: "管理员登录后台管理系统。",
  robots: { index: false, follow: false },
};

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("邮箱或密码错误");
        setLoading(false);
      } else {
        const userRes = await fetch("/api/auth/session");
        const session = await userRes.json();
        const userRole = session?.user?.role;

        if (userRole !== "ADMIN") {
          setError("该账户不是管理员，无法访问后台");
          setLoading(false);
          return;
        }

        router.push(callbackUrl || "/admin");
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("登录服务暂时不可用，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <SkipLink />

      {/* Left Side - Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-purple-600 to-indigo-800">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h2 className="text-4xl font-bold mb-6">管理后台</h2>
          <p className="text-xl text-white/90 mb-8">
            系统管理、数据审核、用户管理
          </p>
          <ul className="space-y-4 text-white/80">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
              <span>职位与企业管理</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
              <span>数据分析与报表</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
              <span>系统配置与维护</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员登录</h1>
            <p className="text-gray-500">登录后台，进行系统管理和数据审核</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="admin@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "登录中..." : "管理员登录"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 border-t pt-6 text-center space-y-3">
            <Link href="/auth/login" className="text-sm text-blue-600 font-medium hover:underline block">
              ← 切换至求职者登录
            </Link>
            <Link href="/auth/login/company" className="text-sm text-emerald-600 font-medium hover:underline block">
              切换至企业登录 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
