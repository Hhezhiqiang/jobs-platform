"use client";

import type { job_applications, jobs, users } from "@prisma/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";

const statusOptions = [
  { value: "PENDING", label: "待处理", color: "bg-yellow-100 text-yellow-800" },
  { value: "VIEWED", label: "已查看", color: "bg-blue-100 text-blue-800" },
  { value: "INTERVIEW", label: "面试", color: "bg-purple-100 text-purple-800" },
  { value: "OFFER", label: "录用", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "不合适", color: "bg-gray-100 text-gray-600" },
];

type ApplicationWithJobAndUser = job_applications & { job: jobs & { companies?: { name: string } }; user: users };

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationWithJobAndUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [params.id]);

  const fetchApplication = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/company/applications/${params.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setApplication(data.application);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "获取申请详情失败");
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/company/applications/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setApplication(data.application);
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

      if (!res.ok) {
        throw new Error(data.error);
      }

      setShowReplyModal(false);
      setReplyMessage("");
      alert("回复已发送");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "发送回复失败");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${option?.color || "bg-gray-100"}`}>
        {option?.label || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-4xl px-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm h-20 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm h-96 animate-pulse" />
            <div className="bg-white rounded-xl shadow-sm h-64 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">简历详情</h1>
              <p className="text-sm text-gray-500">
                {application?.job?.title}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：候选人信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {application?.user?.avatar ? (
                      <Image
                        src={application.user.avatar}
                        alt={application.user.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {application?.user?.name || "匿名用户"}
                    </h2>
                    <p className="text-gray-500">
                      {application?.user?.email || "暂无简介"}
                    </p>
                  </div>
                </div>
                {getStatusBadge(application?.status || "PENDING")}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {application?.user?.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">邮箱</p>
                      <p>{application.user.email}</p>
                    </div>
                  </div>
                )}
                {application?.user?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">电话</p>
                      <p>{application.user.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">申请时间</p>
                    <p>
                      {application?.appliedAt &&
                        new Date(application.appliedAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 求职信 */}
            {application?.coverLetter && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">求职信</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {application.coverLetter}
                </p>
              </div>
            )}

            {/* 简历文件 - 类型待修复：需要包含 resume 关联 */
            {/* {application?.resume && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">附件简历</h3>
                <a
                  href={application.resume.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{application.resume.name}</p>
                    <p className="text-sm text-gray-500">
                      {Math.round(application.resume.fileSize / 1024)} KB
                    </p>
                  </div>
                </a>
              </div>
            )} */}

            {/* 工作经历 */}
            {application?.user?.profile?.workExperience && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">工作经历</h3>
                <div className="space-y-4">
                  {application.user.profile?.workExperience?.map(
                    (exp: any, index: number) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-4">
                        <p className="font-medium">{exp.position}</p>
                        <p className="text-gray-600">{exp.companies}</p>
                        <p className="text-sm text-gray-500">
                          {exp.startDate} - {exp.endDate || "至今"}
                        </p>
                        <p className="text-gray-700 mt-2">{exp.description}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* 教育背景 */}
            {application?.user?.profile?.education && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">教育背景</h3>
                <div className="space-y-4">
                  {application.user.user_profiles.education.map(
                    (edu: any, index: number) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-4">
                        <p className="font-medium">{edu.school}</p>
                        <p className="text-gray-600">
                          {edu.degree} · {edu.major}
                        </p>
                        <p className="text-sm text-gray-500">
                          {edu.startDate} - {edu.endDate || "至今"}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：操作面板 */}
          <div className="space-y-6">
            {/* 状态管理 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">更新状态</h3>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateStatus(option.value)}
                    disabled={isUpdating || application?.status === option.value}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-colors ${
                      application?.status === option.value
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {application?.status === option.value && (
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">快捷操作</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowReplyModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                  <span>发送消息</span>
                </button>

                {application?.user?.email && (
                  <a
                    href={`mailto:${application.user.email}`}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Mail className="w-4 h-4" />
                    <span>发送邮件</span>
                  </a>
                )}
              </div>
            </div>

            {/* 历史记录 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">处理记录</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">申请时间</span>
                  <span>
                    {application?.appliedAt &&
                      new Date(application.appliedAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                {application?.viewedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">查看时间</span>
                    <span>
                      {new Date(application.viewedAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                )}
                {application?.respondedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">最后回复</span>
                    <span>
                      {new Date(application.respondedAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 回复弹窗 */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">发送消息</h3>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={5}
                placeholder="请输入您要发送的消息..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={sendReply}
                  disabled={!replyMessage.trim() || isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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