"use client"
import { useLocale } from "next-intl";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, CheckCircle, Building2 } from "lucide-react";
import { SkipLink } from "@/components/skip-link";

export default function RegisterForm() {
  const locale = useLocale();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!formData.name.trim()) return "请输入姓名";
    if (!formData.email.trim()) return "请输入邮箱";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "请输入有效的邮箱地址";
    if (formData.password.length < 8) return "密码至少8位字符";
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) return "密码需包含字母和数字";
    if (formData.password !== formData.confirmPassword) return "两次输入的密码不一致";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "注册失败，请稍后重试");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.ok) {
        router.push(`/${locale}/dashboard`);
      } else {
        router.push(`/${locale}/auth/login`);
      }
    } catch {
      setError("注册失败，请稍后重试");
      setLoading(false);
    }
  };

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
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-bold mb-6">加入招聘平台</h2>
            <p className="text-xl text-blue-100 mb-8">
              创建账号，开启您的职业之旅<br />
              发现优质职位，连接顶尖企业
            </p>
          </div>

          <div className="space-y-4">
            {[
              "浏览海量优质职位",
              "一键投递简历",
              "实时追踪申请进度",
              "获取职场干货资讯",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-800" />
                </div>
                <span className="text-blue-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 bg-white py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              J
            </div>
            <span className="text-2xl font-bold text-gray-900">招聘平台</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">创建账号</h1>
            <p className="text-gray-500">
              已有账号？{" "}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                立即登录
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl flex items-center gap-3" role="alert">
              <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0 text-red-600 text-sm">!</div>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                姓名 <span aria-label="必填">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  aria-required="true"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="请输入您的姓名"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱 <span aria-label="必填">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  aria-required="true"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                手机号
                <span className="text-gray-400 text-xs ml-1">(选填)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="13800000000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码 <span aria-label="必填">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  aria-required="true"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="至少8位，包含字母和数字"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  aria-pressed={showPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {formData.password && (
                <div className="mt-2 flex gap-3 text-xs">
                  <span className={formData.password.length >= 8 ? "text-green-600 flex items-center gap-1" : "text-gray-400 flex items-center gap-1"}>
                    {formData.password.length >= 8 ? <CheckCircle className="w-3 h-3" /> : "○"} 至少8位
                  </span>
                  <span className={/[a-zA-Z]/.test(formData.password) && /\d/.test(formData.password) ? "text-green-600 flex items-center gap-1" : "text-gray-400 flex items-center gap-1"}>
                    {/[a-zA-Z]/.test(formData.password) && /\d/.test(formData.password) ? <CheckCircle className="w-3 h-3" /> : "○"} 字母+数字
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认密码 <span aria-label="必填">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  aria-required="true"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="再次输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {formData.confirmPassword && (
                <div className="mt-1 text-xs">
                  {formData.password === formData.confirmPassword ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> 密码一致
                    </span>
                  ) : (
                    <span className="text-red-500">密码不一致</span>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  立即注册
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            注册即表示同意{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">用户协议</Link>
            {" "}和{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">隐私政策</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
00 hover:text-blue-700 font-medium">用户协议</Link>
            {" "}和{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">隐私政策</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
