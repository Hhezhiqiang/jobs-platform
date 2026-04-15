"use client";

import Link from "next/link";
import Image from "next/image";

interface Story {
  id: string;
  title: string;
  content: string;
  type: string;
  viewCount: number;
  resonanceCount: number;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  _count?: {
    resonances: number;
  };
}

interface StoryCardProps {
  story: Story;
  locale?: string;
  featured?: boolean;
}

const typeLabels: Record<string, string> = {
  EXPERIENCE: "经验分享",
  TRANSITION: "职业转型",
  MILESTONE: "职业里程碑",
  CHALLENGE: "挑战与成长",
  INSIGHT: "行业洞察",
};

const typeIcons: Record<string, string> = {
  EXPERIENCE: "💡",
  TRANSITION: "🔄",
  MILESTONE: "🏆",
  CHALLENGE: "💪",
  INSIGHT: "🔍",
};

export function StoryCard({ story, locale = "zh", featured = false }: StoryCardProps) {
  const typeLabel = typeLabels[story.type] || "其他";
  const typeIcon = typeIcons[story.type] || "📝";
  const resonanceCount = story._count?.resonances ?? story.resonanceCount;

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const summary = story.content.slice(0, 200) + "...";

  if (featured) {
    return (
      <Link
        href={`/${locale}/career-trail/${story.id}`}
        className="group block bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 hover:border-indigo-300 hover:shadow-lg transition-all"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full font-medium">
            {typeIcon} {typeLabel}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 mb-2 line-clamp-2">
          {story.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{summary}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {story.author.avatar ? (
              <Image
                src={story.author.avatar}
                alt={story.author.name}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs">
                {story.author.name.charAt(0)}
              </div>
            )}
            <span>{story.author.name}</span>
          </div>
          <span>🔥 {resonanceCount} 共鸣</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}/career-trail/${story.id}`}
      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="p-6">
        {/* Author & Type */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
              {story.author.avatar ? (
                <Image
                  src={story.author.avatar}
                  alt={story.author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                story.author.name.charAt(0)
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">{story.author.name}</div>
              <div className="text-xs text-gray-500">{formatTime(story.createdAt)}</div>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            {typeIcon} {typeLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {story.title}
        </h3>

        {/* Content Preview */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {summary}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="text-pink-500">💙</span>
            <span>{resonanceCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>👁</span>
            <span>{story.viewCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
