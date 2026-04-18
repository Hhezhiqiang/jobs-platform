"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, User, Building2 } from "lucide-react";
import { SkipLink } from "@/components/skip-link";

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
  const callbackUrl = searchParams.get("callbackUrl");
  const registered = searchParams.get("registered");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Current role state
  const [currentRole, setCurrentRole] = useState<"USER" | "COMPANY">(role as "USER" | "COMPANY");

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
           // If logging in as User but account is Company, warn or redirect
           finalRedirect = "/company/dashboard"; 
        }
        if (currentRole === "COMPANY" && userRole !== "COMPANY" && userRole !== "ADMIN") {
           setError("该账户不是企业账户，请切换至求职者登录");
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
      console.error("Login error:", err);
      setError("登录服务暂时不可用，请稍后重试");
      setLoading(false);
    }
  }

  // Dynamic styles based on selection
  const isUser = currentRole === "USER";
  const bgClass = isUser 
    ? "bg-gradient-to-br from-blue-500 to-indigo-600" 
    : "bg-gradient-to-br from-emerald-500 to-teal-600";
  
  const btnClass = isUser
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div className="min-h-screen flex">
      <SkipLink />
      
      {/* Left Side - Visuals */}
      <div className={`hidden lg:flex lg:w-1/2 relative ${bgClass}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h2 className="text-4xl font-bold mb-6">
            {isUser ? "开启您的职业新篇章" : "寻找全球顶尖人才"}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {isUser ? "连接优质企业，发现无限可能的职业机会" : "高效招聘工具，助您快速组建精英团队"}
          </p>
          <ul className="space-y-4 text-white/80">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
              <span>{isUser ? "海量优质职位" : "千万级人才库"}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
              <span>{isUser ? "精准职位推荐" : "智能简历匹配"}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
              <span>{isUser ? "简历一键投递" : "高效沟通协作"}</span>
            </li>
          </ul>
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

          {/* Role Switcher - Critical for UX */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
            <button
              onClick={() => setCurrentRole("USER")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                isUser ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="w-4 h-4" />
              求职者
            </button>
            <button
              onClick={() => setCurrentRole("COMPANY")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                !isUser ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Building2 className="w-4 h-4" />
              企业
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isUser ? "欢迎回来" : "欢迎回来"}
            </h1>
            <p className="text-gray-500">
              {isUser ? "登录您的账户，继续求职之旅" : "登录企业后台，管理您的招聘"}
            </p>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="your@email.com"
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
              className={`w-full text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${btnClass}`}
            >
              {loading ? "登录中..." : (isUser ? "求职者登录" : "企业登录")}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 border-t pt-6">
            {isUser ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">
                  还没有账户？{" "}
                  <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
                    立即注册
                  </Link>
                </p>
                <Link href="/auth/login/company" className="text-sm text-emerald-600 font-medium hover:underline block">
                  切换至企业登录 &rarr;
                </Link>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">
                  还没有企业账户？{" "}
                  <Link href="/auth/register" className="text-emerald-600 font-medium hover:underline">
                    注册企业
                  </Link>
                </p>
                <Link href="/auth/login" className="text-sm text-blue-600 font-medium hover:underline block">
                  &larr; 切换至求职者登录
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
