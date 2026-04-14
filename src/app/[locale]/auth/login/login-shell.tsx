"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
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

        // 角色校验
        if (role === "ADMIN" && userRole !== "ADMIN") {
          setError("该账户不是管理员账户");
          setLoading(false);
          return;
        }
        if (role === "COMPANY" && userRole !== "COMPANY" && userRole !== "ADMIN") {
          setError("该账户不是企业账户");
          setLoading(false);
          return;
        }

        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push(redirectUrl);
        }
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("登录服务暂时不可用，请稍后重试");
      setLoading(false);
    }
  }

  const borderClass = {
    blue: "from-blue-600 to-blue-800",
    emerald: "from-emerald-600 to-emerald-800",
    purple: "from-purple-600 to-purple-800",
  }[accentColor] || "from-blue-600 to-blue-800";

  const buttonClass = {
    blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20",
    emerald: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20",
    purple: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500/20",
  }[accentColor] || "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20";

  return (
    <div className="min-h-screen flex">
      <SkipLink />
      
      <div className={`hidden lg:flex lg:w-1/2 relative bg-gradient-to-br ${borderClass}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-6">{title}</h2>
            <p className="text-xl text-white/90 mb-6">{subtitle}</p>
            <ul className="space-y-4 text-white/80">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white/60 rounded-full" />
                <span>安全可靠的账户保护</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white/60 rounded-full" />
                <span>快速便捷的登录体验</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white/60 rounded-full" />
                <span>专业高效的服务支持</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {registered && (
            <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-xl text-sm">
              注册成功！请使用您的邮箱和密码登录
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {registerLink ? (
              <p className="text-gray-500">
                还没有账户？{" "}
                <Link href={registerLink.href} className="text-blue-600 hover:text-blue-700 font-medium">
                  {registerLink.text}
                </Link>
              </p>
            ) : (
              <p className="text-gray-500">请输入账户信息登录</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

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
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

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

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${buttonClass}`}
            >
              {loading ? "登录中..." : "登录"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8">
            {/* 角色切换标签 */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                选择登录身份
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              <Link
                href="/auth/login"
                className={`text-center py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                  role === 'USER'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👤 求职者
              </Link>
              <Link
                href="/auth/login/company"
                className={`text-center py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                  role === 'COMPANY'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🏢 企业
              </Link>
              <Link
                href="/auth/login/admin"
                className={`text-center py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                  role === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ⚙️ 管理员
              </Link>
            </div>

            <div className="border-t border-gray-200 pt-6">
              {alternateLinks?.map((link) => (
                <div key={link.href} className="text-center">
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                    {link.text}
                  </Link>
                </div>
              ))}
              <div className="text-center mt-3">
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                  ← 返回首页
                </Link>
              </div>
            </div>
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
