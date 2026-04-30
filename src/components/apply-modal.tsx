"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface ApplyModalProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyModal({
  jobId,
  jobTitle,
  companyName,
  onClose,
  onSuccess,
}: ApplyModalProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isGuest = !session;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isGuest) {
      if (!email.trim()) {
        setError(isEn ? "Please enter your email address" : "请填写邮箱地址");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError(isEn ? "Invalid email format" : "邮箱格式不正确");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          coverLetter: coverLetter.trim() || undefined,
          email: isGuest ? email.trim() : undefined,
          name: isGuest ? name.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
      } else {
        setError(data.error || (isEn ? "Application failed, please try again" : "申请失败，请稍后重试"));
      }
    } catch {
      setError(isEn ? "Application failed, please try again" : "申请失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{isEn ? "Apply for Position" : "申请职位"}</h2>
              <p className="text-gray-600 mt-1">{jobTitle} · {companyName}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">{error}</div>
          )}

          {/* 游客填写基本信息 */}
          {isGuest && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isEn ? "Name (Optional)" : "姓名（可选）"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isEn ? "Your name" : "请输入姓名"}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isEn ? "Email Address" : "邮箱地址"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={isEn ? "your@email.com" : "请输入邮箱地址"}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {isEn ? "We'll send application updates to this email" : "我们将通过此邮箱发送申请进度通知"}
                </p>
              </div>
            </>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isEn ? "Cover Letter (Optional)" : "求职信（可选）"}
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              placeholder={isEn ? "Introduce yourself and explain why you're a great fit..." : "向招聘方介绍自己，说明为什么适合这个职位..."}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 提示区域 */}
          {isGuest ? (
            <div className="space-y-3 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  🎉 {isEn ? "No account? You can still apply!" : "没有账号？也可以直接申请！"}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  💡 {isEn ? "Create an account to track your applications" : "注册账号后可以追踪申请状态"}
                </p>
                <Link
                  href={`/${locale}/auth/register`}
                  className="text-sm text-blue-700 underline hover:text-blue-900"
                >
                  {isEn ? "Register Now →" : "立即注册 →"}
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                💡 {isEn ? "Check application status in Dashboard -> My Applications" : "提示：申请后可以在「个人中心 -> 我的申请」中查看申请状态"}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50"
            >
              {isEn ? "Cancel" : "取消"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (isEn ? "Submitting..." : "提交中...") : (isEn ? "Submit Application" : "确认申请")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
