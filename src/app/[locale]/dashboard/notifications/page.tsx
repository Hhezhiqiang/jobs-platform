"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { Bell, Check, Trash2, Clock, FileText, Briefcase, Gift, AlertCircle, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { logger } from '@/lib/logger';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
}

const notificationIcons: Record<string, React.ReactNode> = {
  APPLICATION_UPDATE: <FileText className="w-5 h-5 text-blue-500" />,
  INTERVIEW_INVITE: <Briefcase className="w-5 h-5 text-green-500" />,
  OFFER_RECEIVED: <Gift className="w-5 h-5 text-purple-500" />,
  JOB_ALERT: <Briefcase className="w-5 h-5 text-orange-500" />,
  SYSTEM: <AlertCircle className="w-5 h-5 text-gray-500" />,
};

const typeLabels: Record<string, string> = {
  APPLICATION_UPDATE: "申请更新",
  INTERVIEW_INVITE: "面试邀请",
  OFFER_RECEIVED: "录用通知",
  JOB_ALERT: "职位提醒",
  SYSTEM: "系统通知",
};

export default function NotificationsPage() {
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const limit = 10;

  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      setLoading(true);
      const unreadParam = filter === "unread" ? "&unread=true" : "";
      const response = await fetch(
        `/api/notifications?page=${page}&limit=${limit}${unreadParam}`
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setTotalPages(data.pagination.totalPages);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      logger.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [status, page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      logger.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      logger.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const deletedNotification = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      logger.error("Failed to delete notification:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <Link href={`/${locale}/dashboard`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> 返回个人中心
      </Link>
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            通知中心
          </h1>
          <p className="text-gray-500 mt-1">
            您有 {unreadCount} 条未读通知
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => {
                setFilter("unread");
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === "unread"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              未读
              {unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              全部已读
            </button>
          )}
        </div>
      </div>

      {/* 通知列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">{filter === "unread" ? "没有未读通知" : "暂无通知"}</p>
            <p className="text-sm mt-1">{filter === "unread" ? "所有通知已读" : "有新的消息会在这里显示"}</p>
            {filter === "unread" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                查看全部通知
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? "bg-blue-50/30" : ""
                  }`}
>
                  <div className="flex gap-4">
                    {/* 图标 */}
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {notificationIcons[notification.type] || notificationIcons.SYSTEM}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {typeLabels[notification.type] || "通知"}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <h3
                            className={`font-medium ${
                              !notification.isRead ? "text-gray-900" : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h3>
                        </div>
                        <span className="text-sm text-gray-400 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-4 h-4" />
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">{notification.content}</p>

                      {/* 相关链接 */}
                      {notification.metadata?.applicationId && (
                        <Link
                          href={`/${locale}/dashboard/applications`}
                          className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700"
                        >
                          查看申请详情 →
                        </Link>
                      )}
                      {notification.metadata?.jobId && (
                        <Link
                          href={`/${locale}/jobs/${notification.metadata.jobId}`}
                          className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700"
                        >
                          查看职位详情 →
                        </Link>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 mt-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            标记已读
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </button>
                <span className="text-sm text-gray-500">
                  第 {page} 页，共 {totalPages} 页
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}