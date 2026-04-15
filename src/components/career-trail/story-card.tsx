import Link from "next/link";
import Image from "next/image";

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    content: string;
    summary: string | null;
    category: string;
    tags: string[];
    companyName: string | null;
    position: string | null;
    workYears: string | null;
    location: string | null;
    viewCount: number;
    resonanceCount: number;
    commentCount: number;
    createdAt: Date;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
    _count: {
      resonances: number;
      comments: number;
    };
  };
  locale: string;
  featured?: boolean;
}

const categoryLabels: Record<string, string> = {
  PROMOTION: "晋升加薪",
  TRANSITION: "转行经历",
  INTERVIEW: "面试经验",
  RESIGN: "离职复盘",
  SIDE_HUSTLE: "副业探索",
  LEADERSHIP: "团队管理",
  REMOTE: "远程工作",
  WORK_LIFE: "工作生活",
  OTHER: "其他",
};

const categoryIcons: Record<string, string> = {
  PROMOTION: "🚀",
  TRANSITION: "🔄",
  INTERVIEW: "🎯",
  RESIGN: "👋",
  SIDE_HUSTLE: "💡",
  LEADERSHIP: "👥",
  REMOTE: "🏠",
  WORK_LIFE: "⚖️",
  OTHER: "📝",
};

export function StoryCard({ story, locale, featured = false }: StoryCardProps) {
  const summary = story.summary || story.content.slice(0, 200) + "...";
  const categoryLabel = categoryLabels[story.category] || "其他";
  const categoryIcon = categoryIcons[story.category] || "📝";

  if (featured) {
    return (
      <Link
        href={`/${locale}/career-trail/${story.id}`}
        className="group block bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
            {categoryIcon} {categoryLabel}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2 line-clamp-2">
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
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                {story.author.name.charAt(0)}
              </div>
            )}
            <span>{story.author.name}</span>
          </div>
          <span>🔥 {story.resonanceCount} 共鸣</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}/career-trail/${story.id}`}
      className="group block bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          {story.author.avatar ? (
            <Image
              src={story.author.avatar}
              alt={story.author.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
              {story.author.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500">{story.author.name}</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {categoryIcon} {categoryLabel}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2 line-clamp-1">
            {story.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{summary}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>👁 {story.viewCount + 1}</span>
            <span>💙 {story.resonanceCount}</span>
            <span>💬 {story.commentCount}</span>
            <span>{new Date(story.createdAt).toLocaleDateString("zh-CN")}</span>
          </div>

          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {story.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
