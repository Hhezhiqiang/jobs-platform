"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Plus, MessageSquare, CheckCircle, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// 标签类型定义
type ConsensusCategory = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

interface Tag {
  id: string;
  tagName: string;
  category: ConsensusCategory;
  positiveCount: number;
  negativeCount: number;
  netCount: number;
}

interface ConsensusClientProps {
  companyId: string;
  initialTags: Tag[];
  locale: string;
}

// 分类配置
const categoryConfig = {
  POSITIVE: {
    label: "正面标签",
    icon: CheckCircle,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    badgeColor: "bg-blue-100 text-blue-700",
    buttonColor: "hover:bg-blue-100",
  },
  NEUTRAL: {
    label: "中性标签",
    icon: AlertTriangle,
    color: "yellow",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    badgeColor: "bg-yellow-100 text-yellow-700",
    buttonColor: "hover:bg-yellow-100",
  },
  NEGATIVE: {
    label: "负面标签",
    icon: XCircle,
    color: "red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    badgeColor: "bg-red-100 text-red-700",
    buttonColor: "hover:bg-red-100",
  },
};

// 分类选项
const categoryOptions: { value: ConsensusCategory; label: string }[] = [
  { value: "POSITIVE", label: "正面标签" },
  { value: "NEUTRAL", label: "中性标签" },
  { value: "NEGATIVE", label: "负面标签" },
];

export function ConsensusClient({ companyId, initialTags, locale }: ConsensusClientProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // TODO: 从session获取
  const [newTagName, setNewTagName] = useState("");
  const [newTagCategory, setNewTagCategory] = useState<ConsensusCategory>("POSITIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});

  // 按分类分组
  const positiveTags = tags.filter((t) => t.category === "POSITIVE");
  const neutralTags = tags.filter((t) => t.category === "NEUTRAL");
  const negativeTags = tags.filter((t) => t.category === "NEGATIVE");

  // 投票处理
  const handleVote = async (tagId: string, isPositive: boolean) => {
    if (!isLoggedIn) {
      // 显示登录提示
      return;
    }

    try {
      const response = await fetch(`/api/companies/${companyId}/consensus/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, isPositive }),
      });

      if (response.ok) {
        // 更新本地状态
        setTags((prev) =>
          prev.map((tag) =>
            tag.id === tagId
              ? {
                  ...tag,
                  positiveCount: isPositive ? tag.positiveCount + 1 : tag.positiveCount,
                  negativeCount: !isPositive ? tag.negativeCount + 1 : tag.negativeCount,
                  netCount: tag.netCount + (isPositive ? 1 : -1),
                }
              : tag
          )
        );
        setUserVotes((prev) => ({ ...prev, [tagId]: isPositive }));
      }
    } catch (error) {
      console.error("Vote failed:", error);
    }
  };

  // 添加新标签
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !isLoggedIn) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/companies/${companyId}/consensus/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagName: newTagName, category: newTagCategory }),
      });

      if (response.ok) {
        const data = await response.json();
        setTags((prev) => [
          ...prev,
          {
            id: data.tag.id,
            tagName: data.tag.tagName,
            category: data.tag.category,
            positiveCount: 1,
            negativeCount: 0,
            netCount: 1,
          },
        ]);
        setNewTagName("");
        setUserVotes((prev) => ({ ...prev, [data.tag.id]: true }));
      }
    } catch (error) {
      console.error("Add tag failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 标签卡片组件
  const TagCard = ({ tag }: { tag: Tag }) => {
    const config = categoryConfig[tag.category];
    const Icon = config.icon;
    const hasVoted = tag.id in userVotes;

    return (
      <div
        className={cn(
          "group relative rounded-xl border p-4 transition-all hover:shadow-md",
          config.bgColor,
          config.borderColor
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("w-4 h-4", config.textColor)} />
              <span className={cn("text-sm font-medium px-2 py-0.5 rounded-full", config.badgeColor)}>
                {config.label}
              </span>
            </div>
            <h4 className={cn("font-semibold text-lg", config.textColor)}>{tag.tagName}</h4>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" />
                {tag.positiveCount}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="w-3.5 h-3.5" />
                {tag.negativeCount}
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <TrendingUp className="w-3.5 h-3.5" />
                净票数: {tag.netCount > 0 ? `+${tag.netCount}` : tag.netCount}
              </span>
            </div>
          </div>
        </div>

        {/* 投票按钮 */}
        {isLoggedIn ? (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleVote(tag.id, true)}
              disabled={hasVoted && userVotes[tag.id]}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                "border border-transparent",
                hasVoted && userVotes[tag.id]
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-white/60 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              认同
            </button>
            <button
              onClick={() => handleVote(tag.id, false)}
              disabled={hasVoted && !userVotes[tag.id]}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                "border border-transparent",
                hasVoted && !userVotes[tag.id]
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-white/60 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              )}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              不认同
            </button>
          </div>
        ) : (
          <div className="mt-3 text-xs text-gray-500 bg-white/60 rounded-lg px-3 py-2">
            <a href={`/${locale}/auth/login`} className="text-blue-600 hover:underline">
              登录
            </a>
            后可投票
          </div>
        )}
      </div>
    );
  };

  // 标签组组件
  const TagSection = ({
    title,
    tags,
    category,
  }: {
    title: string;
    tags: Tag[];
    category: ConsensusCategory;
  }) => {
    const config = categoryConfig[category];
    const Icon = config.icon;

    return (
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className={cn("p-2 rounded-lg", config.badgeColor)}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <span
            className={cn(
              "px-2 py-0.5 text-sm font-medium rounded-full",
              config.badgeColor
            )}
          >
            {tags.length}
          </span>
        </div>
        {tags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tags.map((tag) => (
              <TagCard key={tag.id} tag={tag} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">暂无标签，快来添加第一个吧！</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content - Tags */}
      <div className="lg:col-span-2">
        {/* Positive Tags */}
        {positiveTags.length > 0 && (
          <TagSection title="正面共识" tags={positiveTags} category="POSITIVE" />
        )}

        {/* Neutral Tags */}
        {neutralTags.length > 0 && (
          <TagSection title="中性共识" tags={neutralTags} category="NEUTRAL" />
        )}

        {/* Negative Tags */}
        {negativeTags.length > 0 && (
          <TagSection title="负面共识" tags={negativeTags} category="NEGATIVE" />
        )}

        {/* Empty State */}
        {tags.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无共识标签</h3>
            <p className="text-gray-500">成为第一个添加标签的人吧！</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Add New Tag */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            添加新标签
          </h3>

          {isLoggedIn ? (
            <form onSubmit={handleAddTag} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  标签名称
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="例如：扁平管理"
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{newTagName.length}/20 字符</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  标签分类
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categoryOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewTagCategory(option.value)}
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-lg border transition-all",
                        newTagCategory === option.value
                          ? option.value === "POSITIVE"
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : option.value === "NEUTRAL"
                            ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                            : "bg-red-100 border-red-300 text-red-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newTagName.trim()}
                className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    添加标签
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                添加后自动获得一票认同
              </p>
            </form>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-xl">
              <p className="text-gray-600 mb-4">登录后即可添加标签</p>
              <a
                href={`/${locale}/auth/login`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                立即登录
              </a>
            </div>
          )}
        </div>

        {/* Tips Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <h3 className="text-sm font-bold text-indigo-900 mb-3">💡 共识墙说明</h3>
          <ul className="space-y-2 text-sm text-indigo-700">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              共识标签由员工匿名投票生成
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              每条标签反映多数员工的共同看法
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              请基于真实工作体验投票
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              每个用户对同一标签只能投一票
            </li>
          </ul>
        </div>

        {/* Popular Tags */}
        {tags.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              热门标签
            </h3>
            <div className="space-y-3">
              {tags
                .sort((a, b) => b.netCount - a.netCount)
                .slice(0, 5)
                .map((tag, index) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-5 h-5 flex items-center justify-center text-xs font-bold rounded",
                          index < 3
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{tag.tagName}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {tag.positiveCount + tag.negativeCount} 票
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
