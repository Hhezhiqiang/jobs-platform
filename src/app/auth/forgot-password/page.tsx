"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入有效的邮箱地址");
      setLoading(false);
      return;
    }

    // 模拟发送重置密码邮件
    // 实际项目中需要调用后端API
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            JobBoard
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">重置密码</h1>
          <p className="text-gray-600">请输入您的邮箱地址，我们将发送密码重置链接</p>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-xl font-semibold mb-4">邮件已发送</h2>
            <p className="text-gray-600 mb-6">
              如果您的邮箱已注册，我们已向 {email} 发送了密码重置链接。
              请检查您的收件箱，并按照邮件中的指示重置密码。
            </p>
            <p className="text-sm text-gray-500 mb-6">
              如果您没有收到邮件，请检查垃圾邮件文件夹，或
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                重新发送
              </button>
            </p>
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-800"
            >
              返回登录 →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? "发送中..." : "发送重置链接"}
            </button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-800"
              >
                想起密码了？返回登录
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
