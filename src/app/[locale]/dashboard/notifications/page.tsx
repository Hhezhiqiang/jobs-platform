"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
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

export default function NotificationsPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.notificationsPage");
  const tFilter = useTranslations("dashboard.notificationsPage.filter");
  const tEmpty = useTranslations("dashboard.notificationsPage.empty");
  const tTypes = useTranslations("dashboard.notificationsPage.typeLabels");
  const tActions = useTranslations("dashboard.notificationsPage.actions");
  const tPag = useTranslations("dashboard.notificationsPage.pagination");
  const tTime = useTranslations("dashboard.notificationsPage.time");

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
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
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
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      logger.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, { method: "DELETE" });
      if (response.ok) {
        const deleted = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
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

    if (minutes < 1) return tTime("justNow");
    if (minutes < 60) return tTime("minutesAgo", { n: minutes });
    if (hours < 24) return tTime("hoursAgo", { n: hours });
    if (days < 7) return tTime("daysAgo", { n: days });
    return date.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typeLabel = (typeKey: string) => {
    const known = ["APPLICATION_UPDATE", "INTERVIEW_INVITE", "OFFER_RECEIVED", "JOB_ALERT", "SYSTEM"];
    return known.includes(typeKey) ? tTypes(typeKey) : tTypes("DEFAULT");
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
        <ArrowLeft className="w-4 h-4" /> {t("back")}
      </Link>
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            {t("title")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("unreadCount", { count: unreadCount })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setFilter("all"); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              {tFilter("all")}
            </button>
            <button
              onClick={() => { setFilter("unread"); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === "unread" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              {tFilter("unread")}
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
              {t("markAllRead")}
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
            <p className="text-lg font-medium">{filter === "unread" ? tEmpty("unreadTitle") : tEmpty("allTitle")}</p>
            <p className="text-sm mt-1">{filter === "unread" ? tEmpty("unreadSubtitle") : tEmpty("allSubtitle")}</p>
            {filter === "unread" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {tEmpty("viewAll")}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50/30" : ""}`}
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {notificationIcons[notification.type] || notificationIcons.SYSTEM}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {typeLabel(notification.type)}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <h3 className={`font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                            {notification.title}
                          </h3>
                        </div>
                        <span className="text-sm text-gray-400 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-4 h-4" />
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">{notification.content}</p>

                      {notification.metadata?.applicationId && (
                        <Link href={`/${locale}/dashboard/applications`} className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700">
                          {t("viewApplication")}
                        </Link>
                      )}
                      {notification.metadata?.jobId && (
                        <Link href={`/${locale}/jobs/${notification.metadata.jobId}`} className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700">
                          {t("viewJob")}
                        </Link>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            {tActions("markRead")}
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          {tActions("delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {tPag("prev")}
                </button>
                <span className="text-sm text-gray-500">
                  {tPag("summary", { page, total: totalPages })}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tPag("next")}
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
