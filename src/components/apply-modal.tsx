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

  const [step, setStep] = useState<"form" | "success">("form");
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
        setStep("success");
      } else {
        setError(data.error || (isEn ? "Application failed, please try again" : "申请失败，请稍后重试"));
      }
    } catch {
      setError(isEn ? "Application failed, please try again" : "申请失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 成功状态 - 渐进式引导注册
  if (step === "success") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isEn ? "Application Submitted!" : "申请已提交！"}
          </h2>
          <p className="text-gray-600 mb-6">
            {isEn 
              ? "We've sent a confirmation to your email. The employer will review it shortly."
              : "确认邮件已发送至您的邮箱。招聘方将尽快审核您的申请。"}
          </p>

          {isGuest ? (
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm font-medium text-blue-900 mb-2">
                🎁 {isEn ? "Track your applications anytime" : "随时追踪您的申请进度"}
              </p>
              <p className="text-sm text-blue-700 mb-4">
                {isEn ? "Create an account in 30 seconds to link this application and receive real-time updates." : "30秒创建账号，关联本次申请并接收实时状态更新。"}
              </p>
              <Link
                href={`/${locale}/auth/register?email=${encodeURIComponent(email)}`}
                className="block w-full py-2.5 bg-blue-600 text-white text-center rounded-lg font-medium hover:bg-blue-700 transition-colors mb-2"
              >
                {isEn ? "Create Account Now →" : "立即注册账号 →"}
              </Link>
              <button
                onClick={onSuccess}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                {isEn ? "Maybe later" : "稍后再说"}
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                {isEn ? "Check status in Dashboard -> My Applications" : "可在「个人中心 -> 我的申请」中查看进度"}
              </p>
            </div>
          )}

          <button
            onClick={onSuccess}
            className="w-full py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            {isEn ? "Close" : "关闭"}
          </button>
        </div>
      </div>
    );
  }

  // 表单状态
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{isEn ? "Quick Apply" : "快速申请"}</h2>
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
                  {isEn ? "We'll send application updates to this email" : "申请进度将通过此邮箱通知您"}
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
              rows={4}
              placeholder={isEn ? "Briefly introduce yourself..." : "简单介绍自己..."}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 提示区域 */}
          {isGuest && (
            <div className="bg-green-50 p-3 rounded-lg mb-6 flex items-start gap-2">
              <span className="text-lg">🚀</span>
              <p className="text-sm text-green-800">
                {isEn ? "No account needed! Just fill in your email to apply instantly." : "无需注册！填写邮箱即可极速申请"}
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
