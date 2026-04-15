"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { 
  Briefcase, 
  Search, 
  EyeOff, 
  Users, 
  Globe, 
  Lock,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  ArrowLeft
} from "lucide-react";

// 求职状态配置
const statusConfig = {
  OPEN: {
    label: "积极求职",
    description: "正在积极寻找新机会，欢迎推荐",
    color: "bg-green-500",
    icon: Briefcase,
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  PASSIVE: {
    label: "看看机会",
    description: "有合适的可以考虑，保持关注",
    color: "bg-yellow-500",
    icon: EyeOff,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
  },
  CLOSED: {
    label: "暂不看机会",
    description: "当前不看新机会",
    color: "bg-gray-400",
    icon: Lock,
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
  },
};

// 隐私设置配置
const privacyConfig = {
  PUBLIC: {
    label: "公开",
    description: "所有人都可以看到我的求职状态",
    icon: Globe,
  },
  FOLLOWERS: {
    label: "仅关注者",
    description: "只有关注我的人可以看到",
    icon: Users,
  },
  CIRCLES: {
    label: "仅圈内成员",
    description: "只有同圈子的人可以看到",
    icon: Briefcase,
  },
  PRIVATE: {
    label: "仅自己",
    description: "仅自己可见（开启求职状态后自动设为此项）",
    icon: Lock,
  },
};

// 常用期望标签
const commonTags = [
  "技术驱动", "创业氛围", "大厂平台", "远程办公",
  "弹性工作", "快速成长", "股票期权", "扁平管理",
  "国际化", "AI/ML", "Web3", "新能源",
  "金融科技", "电商", "游戏", "企业服务",
];

export default function JobStatusPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const locale = useLocale();
  
  // 表单状态
  const [status, setStatus] = useState<"OPEN" | "PASSIVE" | "CLOSED">("CLOSED");
  const [expectTags, setExpectTags] = useState<string[]>([]);
  const [expectSalary, setExpectSalary] = useState("");
  const [bio, setBio] = useState("");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "FOLLOWERS" | "CIRCLES" | "PRIVATE">("CIRCLES");
  
  // UI 状态
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [stats, setStats] = useState({ viewCount: 0, recommendCount: 0 });

  // 加载当前状态
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push(`/${locale}/auth/login`);
      return;
    }

    if (sessionStatus === "authenticated") {
      fetchJobStatus();
    }
  }, [sessionStatus, router, locale]);

  const fetchJobStatus = async () => {
    try {
      const response = await fetch("/api/user/job-status");
      if (!response.ok) {
        throw new Error("获取求职状态失败");
      }
      const data = await response.json();
      
      setStatus(data.status);
      setExpectTags(data.expectTags || []);
      setExpectSalary(data.expectSalary || "");
      setBio(data.bio || "");
      setPrivacy(data.privacy);
      setStats({
        viewCount: data.viewCount || 0,
        recommendCount: data.recommendCount || 0,
      });
    } catch (err) {
      console.error("Error fetching job status:", err);
      setError("加载求职状态失败，请刷新重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/user/job-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          expectTags,
          expectSalary: expectSalary || undefined,
          bio: bio || undefined,
          privacy: status === "CLOSED" ? "PRIVATE" : privacy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "保存失败");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "保存求职状态失败");
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: string) => {
    if (!expectTags.includes(tag) && expectTags.length < 10) {
      setExpectTags([...expectTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setExpectTags(expectTags.filter((t) => t !== tag));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !expectTags.includes(customTag.trim()) && expectTags.length < 10) {
      setExpectTags([...expectTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/dashboard`}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">求职状态设置</h1>
              <p className="text-gray-500">管理你的求职状态，让机会找到你</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 状态概览卡片 */}
        <div className={`rounded-2xl p-6 mb-8 ${currentStatus.bgColor} border ${currentStatus.borderColor}`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${currentStatus.color} flex items-center justify-center`}>
              <StatusIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${currentStatus.textColor}`}>
                  {currentStatus.label}
                </h2>
                {status !== "CLOSED" && (
                  <div className="text-sm text-gray-500">
                    被浏览 {stats.viewCount} 次 · 收到 {stats.recommendCount} 个推荐
                  </div>
                )}
              </div>
              <p className={`mt-1 ${currentStatus.textColor} opacity-80`}>
                {currentStatus.description}
              </p>
            </div>
          </div>
        </div>

        {/* 求职状态选择 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">当前求职状态</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((key) => {
              const config = statusConfig[key];
              const Icon = config.icon;
              const isSelected = status === key;
              
              return (
                <button
                  key={key}
                  onClick={() => setStatus(key as any)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? `${config.borderColor} ${config.bgColor} ring-2 ring-offset-2 ring-blue-500`
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`font-semibold ${isSelected ? config.textColor : "text-gray-900"}`}>
                    {config.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{config.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 期望标签 */}
        {status !== "CLOSED" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">期望团队/方向（最多10个）</h3>
            
            {/* 已选标签 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {expectTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {expectTags.length === 0 && (
                <span className="text-gray-400 text-sm">选择标签让推荐更精准...</span>
              )}
            </div>

            {/* 自定义标签输入 */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCustomTag()}
                placeholder="添加自定义标签"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
              />
              <button
                onClick={addCustomTag}
                disabled={!customTag.trim() || expectTags.length >= 10}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* 常用标签 */}
            <div className="flex flex-wrap gap-2">
              {commonTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  disabled={expectTags.includes(tag) || expectTags.length >= 10}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    expectTags.includes(tag)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 期望薪资 */}
        {status !== "CLOSED" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">期望薪资范围（可选）</h3>
            <input
              type="text"
              value={expectSalary}
              onChange={(e) => setExpectSalary(e.target.value)}
              placeholder="例如：30k-50k / 面议"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={50}
            />
          </div>
        )}

        {/* 求职宣言 */}
        {status !== "CLOSED" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">求职宣言（可选）</h3>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="写下你的求职期望、个人亮点或职业目标，让别人更好地了解你..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-400 mt-2">
              {bio.length}/500
            </div>
          </div>
        )}

        {/* 隐私设置 */}
        {status !== "CLOSED" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">可见范围</h3>
            <div className="space-y-3">
              {(Object.keys(privacyConfig) as Array<keyof typeof privacyConfig>).map((key) => {
                const config = privacyConfig[key];
                const Icon = config.icon;
                const isSelected = privacy === key;
                
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={key}
                      checked={isSelected}
                      onChange={() => setPrivacy(key as any)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                        {config.label}
                      </div>
                      <div className="text-sm text-gray-500">{config.description}</div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">求职状态已保存</p>
          </div>
        )}

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              保存设置
            </>
          )}
        </button>
      </main>
    </div>
  );
}
