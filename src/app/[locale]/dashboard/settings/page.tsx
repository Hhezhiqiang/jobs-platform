"use client"
import { useLocale } from "next-intl";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("password");

  // 密码相关
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 通知设置
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/login`);
    }
  }, [status, router]);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // 验证密码
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "两次输入的新密码不一致" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "新密码至少8位" });
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      setMessage({ type: "error", text: "新密码需包含字母和数字" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/profile/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.status === 401) {
        router.push(`/${locale}/auth/login`);
        return;
      }

      if (res.ok) {
        setMessage({ type: "success", text: "密码修改成功" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "修改密码失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "修改密码失败，请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const settings = {
      email: emailNotifications,
      jobAlerts,
      applicationUpdates,
      marketingEmails,
    };

    try {
      await fetch("/api/user/notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error("保存通知设置失败:", error);
    }

    localStorage.setItem(
      "notificationSettings",
      JSON.stringify(settings)
    );

    setMessage({ type: "success", text: "通知设置已保存" });
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        "警告：删除账号将永久清除您的所有数据，包括申请记录、简历等。\n\n此操作不可恢复，确定要继续吗？"
      )
    ) {
      return;
    }

    const confirmText = prompt('请输入 "DELETE" 确认删除账号：');
    if (confirmText !== "DELETE") {
      setMessage({ type: "error", text: "删除操作已取消" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: `/${locale}/auth/login?deleted=true` });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "删除账号失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "删除账号失败" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white shadow-sm animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            <div className="hidden md:block w-64 shrink-0">
              <div className="bg-white rounded-lg shadow-sm h-64 animate-pulse" />
            </div>
            <div className="flex-1 space-y-6">
              <div className="bg-white rounded-lg shadow-sm h-80 animate-pulse" />
              <div className="bg-white rounded-lg shadow-sm h-48 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← 返回首页
              </Link>
              <h1 className="text-2xl font-bold">账号设置</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">欢迎，{session?.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 侧边导航 */}
          <div className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4 space-y-2">
              <Link
                href={`/${locale}/dashboard`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                📊 概览
              </Link>
              <Link
                href={`/${locale}/dashboard/profile`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                📄 我的简历
              </Link>
              <Link
                href={`/${locale}/dashboard/applications`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                📋 我的申请
              </Link>
              <Link
                href={`/${locale}/dashboard/settings`}
                className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
              >
                ⚙️ 账号设置
              </Link>
            </nav>
          </div>

          {/* 主内容区 */}
          <div className="md:col-span-3">
            {message.text && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Tab 切换 */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b flex">
                <button
                  onClick={() => setActiveTab("password")}
                  className={`px-6 py-4 font-medium ${
                    activeTab === "password"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  修改密码
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`px-6 py-4 font-medium ${
                    activeTab === "notifications"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  通知设置
                </button>
                <button
                  onClick={() => setActiveTab("danger")}
                  className={`px-6 py-4 font-medium ${
                    activeTab === "danger"
                      ? "border-b-2 border-red-600 text-red-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  危险操作
                </button>
              </div>

              <div className="p-6">
                {/* 修改密码 */}
                {activeTab === "password" && (
                  <form onSubmit={changePassword} className="max-w-md space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        当前密码
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        新密码
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        密码至少8位，需包含字母和数字
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        确认新密码
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "修改中..." : "修改密码"}
                    </button>
                  </form>
                )}

                {/* 通知设置 */}
                {activeTab === "notifications" && (
                  <form onSubmit={saveNotificationSettings} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">邮件通知</p>
                          <p className="text-sm text-gray-500">
                            接收重要的账号和申请相关邮件
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailNotifications}
                            onChange={(e) =>
                              setEmailNotifications(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">职位推荐</p>
                          <p className="text-sm text-gray-500">
                            根据您的偏好推荐相关职位
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={jobAlerts}
                            onChange={(e) => setJobAlerts(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">申请状态更新</p>
                          <p className="text-sm text-gray-500">
                            当您的申请状态发生变化时通知您
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={applicationUpdates}
                            onChange={(e) =>
                              setApplicationUpdates(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">营销邮件</p>
                          <p className="text-sm text-gray-500">
                            接收产品更新、促销活动等信息
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={marketingEmails}
                            onChange={(e) =>
                              setMarketingEmails(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                    >
                      保存设置
                    </button>
                  </form>
                )}

                {/* 危险操作 */}
                {activeTab === "danger" && (
                  <div className="space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">
                        删除账号
                      </h3>
                      <p className="text-red-600 mb-4">
                        删除账号将永久清除您的所有数据，包括：
                      </p>
                      <ul className="list-disc list-inside text-red-600 mb-6 space-y-1">
                        <li>个人资料和简历</li>
                        <li>所有职位申请记录</li>
                        <li>收藏和浏览历史</li>
                        <li>账号相关信息</li>
                      </ul>
                      <p className="text-red-600 mb-4">
                        此操作不可恢复，请谨慎操作。
                      </p>
                      <button
                        onClick={deleteAccount}
                        disabled={loading}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {loading ? "处理中..." : "删除我的账号"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
