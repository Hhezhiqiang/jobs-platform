"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Building2, User, Shield } from "lucide-react";
import { SkipLink } from "@/components/skip-link";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const registered = searchParams.get("registered");
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
        // 登录成功，获取用户信息并跳转
        const userRes = await fetch("/api/auth/session");
        const session = await userRes.json();
        
        if (callbackUrl) {
          // 如果有回调URL，优先跳转到回调URL
          router.push(callbackUrl);
        } else if (session?.user?.role === "ADMIN") {
          // 管理员 → 后台管理
          router.push("/admin");
        } else if (session?.user?.role === "COMPANY" || session?.user?.companies?.length > 0) {
          // 企业用户 → 企业Dashboard
          router.push("/company/dashboard");
        } else {
          // 普通用户 → 用户Dashboard
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("登录服务暂时不可用，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" id="main-content">
      <SkipLink />
      
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-400/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-bold mb-6">欢迎回来</h2>
            <p className="text-xl text-blue-100 mb-6">
              统一登录入口，根据您的身份自动跳转到对应的管理后台
            </p>
            <ul className="space-y-4 text-blue-100">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span>求职者 - 管理简历和申请</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span>企业用户 - 发布职位、管理简历</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span>管理员 - 系统管理和审核</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {registered && (
            <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-xl text-sm">
              注册成功！请使用您的邮箱和密码登录
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">登录</h1>
            <p className="text-gray-500">
              还没有账户？{" "}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                立即注册
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  aria-required="true"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  aria-required="true"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  记住我
                </label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                忘记密码？
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "登录中..." : "登录"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 space-y-3">
            {/* 企业注册入口 */}
            <div className="text-center">
              <span className="text-sm text-gray-500">企业用户？</span>
              <Link href="/company/register" className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-1">
                注册企业账户 →
              </Link>
            </div>
            
            <div className="text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                ← 返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Fallback Component
function LoginErrorFallback() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">页面加载失败</h2>
        <p className="text-gray-500 mb-6">登录服务暂时不可用，请稍后重试</p>
        
        <button
          onClick={() => router.refresh()}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-all"
        >
          重新加载
        </button>
        
        <div className="mt-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main LoginForm with Error Boundary
export default function LoginForm() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
