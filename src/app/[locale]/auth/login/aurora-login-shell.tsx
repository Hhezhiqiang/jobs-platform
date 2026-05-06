"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, User, Building2, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import { SkipLink } from "@/components/skip-link";
import { logger } from '@/lib/logger';

interface LoginPageProps {
  title: string;
  subtitle: string;
  role: "USER" | "COMPANY" | "ADMIN";
  redirectUrl: string;
  accentColor: string;
  registerLink?: { text: string; href: string };
  alternateLinks?: { text: string; href: string }[];
}

function LoginFormContent({
  title,
  subtitle,
  role,
  redirectUrl,
  accentColor,
  registerLink,
  alternateLinks,
}: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const callbackUrl = searchParams?.get("callbackUrl");
  const registered = searchParams?.get("registered");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Current role state - ADMIN stays as ADMIN
  const [currentRole, setCurrentRole] = useState<"USER" | "COMPANY" | "ADMIN">(
    role === "ADMIN" ? "ADMIN" : (role as "USER" | "COMPANY")
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // Determine redirect based on role
      let finalRedirect = redirectUrl;
      if (currentRole === "USER") {
        finalRedirect = "/dashboard";
      } else if (currentRole === "COMPANY") {
        finalRedirect = "/company/dashboard";
      }

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

        // Role check logic
        if (currentRole === "USER" && userRole !== "USER" && userRole !== "ADMIN") {
           setError("请使用正确的角色入口登录");
           setLoading(false);
           return;
        }
        if (currentRole === "COMPANY" && userRole !== "COMPANY" && userRole !== "ADMIN") {
           setError("请使用正确的角色入口登录");
           setLoading(false);
           return;
        }

        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push(finalRedirect);
        }
        router.refresh();
      }
    } catch (err) {
      logger.error("Login error:", err);
      setError("登录服务暂时不可用，请稍后重试");
      setLoading(false);
    }
  }

  // Dynamic styles based on selection
  const isUser = currentRole === "USER";

  return (
    <div className="min-h-screen flex">
      <SkipLink />
      
      {/* Left Side - Aurora Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3]">
        {/* Aurora orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#6366f1]/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "4s" }} />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#8b5cf6]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#6366f1]/10 via-[#06b6d4]/10 to-[#8b5cf6]/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm mb-8 border border-white/10 w-fit">
            <Sparkles className="w-4 h-4 text-[#a5b4fc]" />
            <span className="font-medium">JobQuip 招聘平台</span>
          </div>
          
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            {isUser ? (
              <>
                开启你的
                <span className="block mt-2 bg-gradient-to-r from-[#a5b4fc] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent">
                  职业新篇章
                </span>
              </>
            ) : (
              <>
                寻找全球
                <span className="block mt-2 bg-gradient-to-r from-[#a5b4fc] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent">
                  顶尖人才
                </span>
              </>
            )}
          </h2>
          
          <p className="text-xl text-[#c7d2fe]/80 mb-8 leading-relaxed">
            {isUser ? "连接优质企业，发现无限可能的职业机会" : "高效招聘工具，助您快速组建精英团队"}
          </p>
          
          <ul className="space-y-4 text-[#c7d2fe]/80">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#a5b4fc] rounded-full" />
              <span>{isUser ? "海量优质职位" : "千万级人才库"}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#a5b4fc] rounded-full" />
              <span>{isUser ? "精准职位推荐" : "智能简历匹配"}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#a5b4fc] rounded-full" />
              <span>{isUser ? "简历一键投递" : "高效沟通协作"}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side - Aurora Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f8f7fc]">
        <div className="w-full max-w-md">
          {registered && (
            <div className="mb-6 p-4 bg-[#ecfdf5] text-[#059669] rounded-xl text-sm border border-[#a7f3d0]">
              注册成功！请使用您的邮箱和密码登录
            </div>
          )}

          {/* Aurora Role Switcher */}
          <div className="aurora-card rounded-xl p-1 mb-8">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentRole("USER")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isUser ? "bg-white text-[#4f46e5] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <User className="w-4 h-4" />
                求职者
              </button>
              <button
                onClick={() => setCurrentRole("COMPANY")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                  !isUser ? "bg-white text-[#059669] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Building2 className="w-4 h-4" />
                企业
              </button>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              欢迎回来
            </h1>
            <p className="text-gray-500">
              {isUser ? "登录您的账户，继续求职之旅" : "登录企业后台，管理您的招聘"}
            </p>
          </div>

          {/* Aurora Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  {isUser ? "求职者登录" : "企业登录"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            {isUser ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">
                  还没有账户？{" "}
                  <Link href="/auth/register" className="text-[#6366f1] font-medium hover:underline">
                    立即注册
                  </Link>
                </p>
                <Link href="/auth/login/company" className="text-sm text-[#059669] font-medium hover:underline block">
                  切换至企业登录 →
                </Link>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">
                  还没有企业账户？{" "}
                  <Link href="/company/register" className="text-[#059669] font-medium hover:underline">
                    注册企业
                  </Link>
                </p>
                <Link href={`/${locale}/auth/login`} className="text-sm text-[#6366f1] font-medium hover:underline block">
                  ← 切换至求职者登录
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPageShell(props: LoginPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <LoginFormContent {...props} />
    </Suspense>
  );
}
