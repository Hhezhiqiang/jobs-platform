"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  Mail,
  Phone,
  Calendar,
  Send,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
} from "lucide-react";

type ApplicationDetail = {
  id: string;
  status: string;
  appliedAt: string;
  viewedAt?: string | null;
  respondedAt?: string | null;
  coverLetter?: string | null;
  jobs: {
    id: string;
    title: string;
    slug: string;
    companies?: { id: string; name: string } | null;
  } | null;
  users: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatar: string | null;
  } | null;
};

const statusOptions = [
  { value: "PENDING", label: "待处理", color: "bg-yellow-100 text-yellow-800" },
  { value: "VIEWED", label: "已查看", color: "bg-blue-100 text-blue-800" },
  { value: "INTERVIEW", label: "面试", color: "bg-purple-100 text-purple-800" },
  { value: "OFFER", label: "录用", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "不合适", color: "bg-gray-100 text-gray-600" },
] as const;

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchApplication = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/company/applications/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "获取申请详情失败");
      setApplication(data.application as ApplicationDetail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "获取申请详情失败");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void fetchApplication();
  }, [fetchApplication]);

  const updateStatus = async (status: string) => {
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/company/applications/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新状态失败");
      setApplication(data.application as ApplicationDetail);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "更新状态失败");
    } finally {
      setIsUpdating(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) return;

    try {
      setIsSending(true);
      const res = await fetch(`/api/company/applications/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setShowReplyModal(false);
      setReplyMessage("");
      alert("回复已发送");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "发送失败");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return (
      <span className={`rounded-full px-3 py-1 text-sm font-medium ${option?.color || "bg-gray-100 text-gray-700"}`}>
        {option?.label || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl space-y-6 px-4">
          <div className="h-20 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 animate-pulse rounded-xl bg-white shadow-sm" />
            <div className="h-64 animate-pulse rounded-xl bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!application) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">简历详情</h1>
              <p className="text-sm text-gray-500">{application.jobs?.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                    {application.users?.avatar ? (
                      <Image
                        src={application.users.avatar}
                        alt={application.users.name || "用户"}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{application.users?.name || "匿名用户"}</h2>
                    <p className="text-gray-500">{application.users?.email || "暂无邮箱"}</p>
                  </div>
                </div>
                {getStatusBadge(application.status)}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {application.users?.email && <InfoRow icon={Mail} label="邮箱" value={application.users.email} />}
                {application.users?.phone && <InfoRow icon={Phone} label="电话" value={application.users.phone} />}
                <InfoRow
                  icon={Calendar}
                  label="申请时间"
                  value={new Date(application.appliedAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}
                />
              </div>
            </div>

            {application.coverLetter && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">求职信</h3>
                <p className="whitespace-pre-wrap text-gray-700">{application.coverLetter}</p>
              </div>
            )}

            {application.users?.phone && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">联系方式</h3>
                <p className="text-gray-600">电话: {application.users.phone}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 font-semibold text-gray-900">更新状态</h3>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateStatus(option.value)}
                    disabled={isUpdating || application.status === option.value}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-2 transition-colors ${
                      application.status === option.value ? "border-blue-500 bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {application.status === option.value && <CheckCircle className="h-4 w-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 font-semibold text-gray-900">快捷操作</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowReplyModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                  <span>发送消息</span>
                </button>

                {application.users?.email && (
                  <a
                    href={`mailto:${application.users.email}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
                  >
                    <Mail className="h-4 w-4" />
                    <span>发送邮件</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    const companyId = application.jobs?.companies?.id;
                    const userId = application.users?.id;
                    const jobId = application.jobs?.id;
                    if (!companyId || !userId || !jobId) {
                      alert("缺少会话所需信息");
                      return;
                    }
                    void (async () => {
                      try {
                        const res = await fetch("/api/messages", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ companyId, userId, jobId }),
                        });
                        const data = await res.json();
                        if (res.ok && data.conversation?.id) {
                          router.push(`/${locale}/messages?c=${data.conversation.id}`);
                        } else {
                          alert(data.error || "无法打开会话");
                        }
                      } catch {
                        alert("网络错误");
                      }
                    })();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>打开会话</span>
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 font-semibold text-gray-900">处理记录</h3>
              <div className="space-y-3 text-sm">
                <Row label="申请时间" value={new Date(application.appliedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")} />
                {application.viewedAt && <Row label="查看时间" value={new Date(application.viewedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")} />}
                {application.respondedAt && <Row label="最后回复" value={new Date(application.respondedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")} />}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showReplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">发送消息</h3>
                <button onClick={() => setShowReplyModal(false)} className="rounded p-1 hover:bg-gray-100">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={5}
                placeholder="请输入要发送的消息..."
                className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setShowReplyModal(false)} className="rounded-lg border px-4 py-2 hover:bg-gray-50">
                  取消
                </button>
                <button
                  onClick={sendReply}
                  disabled={!replyMessage.trim() || isSending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSending ? "发送中..." : "发送"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
