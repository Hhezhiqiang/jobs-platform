"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
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
        return;
      }

      // 注册成功，自动登录
      const loginResponse = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          callbackUrl: "/dashboard",
        }),
      });

      if (loginResponse.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/auth/login?registered=true");
      }
    } catch {
      setError("注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center text-2xl font-bold text-blue-600">
          招聘平台
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          创建新账号
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          已有账号？{" "}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            立即登录
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                姓名 *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入您的姓名"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱 *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                手机号
                <span className="text-gray-400 text-xs ml-1">(选填)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="13800000000"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码 *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="至少8位，包含字母和数字"
              />
              {formData.password && (
                <div className="mt-1 text-xs">
                  <span className={formData.password.length >= 8 ? "text-green-600" : "text-gray-400"}>
                    ● 至少8位
                  </span>
                  {" "}
                  <span className={/[a-zA-Z]/.test(formData.password) && /\d/.test(formData.password) ? "text-green-600" : "text-gray-400"}>
                    ● 包含字母和数字
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                确认密码 *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="再次输入密码"
              />
              {formData.confirmPassword && (
                <div className="mt-1 text-xs">
                  {formData.password === formData.confirmPassword ? (
                    <span className="text-green-600">✓ 密码一致</span>
                  ) : (
                    <span className="text-red-500">✗ 密码不一致</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "注册中..." : "立即注册"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">注册即表示同意</span>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500">
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">用户协议</Link>
              {" "}和{" "}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500">隐私政策</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
