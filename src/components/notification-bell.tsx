"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, Trash2, Clock, FileText, Briefcase, Gift, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  metadata: Record<string, string | undefined> | null;
  createdAt: string;
}

const notificationIcons: Record<string, React.ReactNode> = {
  APPLICATION_UPDATE: <FileText className="w-4 h-4 text-blue-500" />,
  INTERVIEW_INVITE: <Briefcase className="w-4 h-4 text-green-500" />,
  OFFER_RECEIVED: <Gift className="w-4 h-4 text-purple-500" />,
  JOB_ALERT: <Briefcase className="w-4 h-4 text-orange-500" />,
  SYSTEM: <AlertCircle className="w-4 h-4 text-gray-500" />,
};

const typeColors: Record<string, string> = {
  APPLICATION_UPDATE: "bg-blue-50",
  INTERVIEW_INVITE: "bg-green-50",
  OFFER_RECEIVED: "bg-purple-50",
  JOB_ALERT: "bg-orange-50",
  SYSTEM: "bg-gray-50",
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoggedIn = status === "authenticated";

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 获取通知列表（带竞态保护）
  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn || isFetchingRef.current) return;
    
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    isFetchingRef.current = true;

    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10", {
        signal: abortRef.current.signal,
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to fetch notifications:", error);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isLoggedIn]);

  // 标记单个通知为已读
  const markAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      console.error("Failed to mark as read:", error);
    }
  };

  // 标记所有为已读
  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      console.error("Failed to mark all as read:", error);
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      console.error("Failed to delete notification:", error);
    }
  };

  // 点击通知处理
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    setIsOpen(false);

    // 如果未读，标记为已读（fire-and-forget with optimistic update）
    if (!notification.isRead) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      }).catch(() => {});

      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // 根据类型跳转
    if (notification.metadata?.applicationId) {
      router.push("/dashboard/applications");
    } else if (notification.metadata?.jobId) {
      router.push(`/jobs/${notification.metadata.jobId}`);
    }
  }, [router]);

  // 格式化时间
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
    return date.toLocaleDateString("zh-CN");
  };

  // 初始加载
  useEffect(() => {
    fetchNotifications();
  }, [isLoggedIn]);

  // 定时刷新（每30秒）
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 铃铛按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="通知"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">通知</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  全部已读
                </button>
              )}
              <button
                onClick={() => router.push("/dashboard/notifications")}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                查看全部
              </button>
            </div>
          </div>

          {/* 通知列表 */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Bell className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">暂无通知</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* 图标 */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          typeColors[notification.type] || "bg-gray-50"
                        }`}
                      >
                        {notificationIcons[notification.type] || notificationIcons.SYSTEM}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-sm font-medium truncate ${
                              !notification.isRead ? "text-gray-900" : "text-gray-600"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notification.content}
                        </p>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => markAsRead(notification.id, e)}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              已读
                            </button>
                          )}
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-red-50 transition-colors ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            删除
                          </button>
                        </div>
                      </div>

                      {/* 未读指示器 */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部 */}
          <div className="border-t border-gray-100 px-4 py-2 bg-gray-50/50">
            <p className="text-xs text-gray-400 text-center">
              {notifications.length > 0 ? "已显示最近10条通知" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}